import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, serverError, fromZodError, fromAppError } from '@/lib/api-response'
import { UnauthorizedError } from '@/core/errors'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyStoredTotp, consumeBackupCode } from '@/lib/mfa/totp'
import { reissueUserSessionCookie } from '@/lib/auth/reissue-user-session'
import { getProfileCompleteness } from '@/lib/auth/session-helpers'
import { resolvePostLoginPath } from '@/lib/pi/pi-post-login-path'

const Schema = z.object({
  code: z.string().min(6).max(16),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return fromAppError(new UnauthorizedError())

    if (!session.user.mfaEnabled || session.user.mfaVerified) {
      return ok({ error: true, message: 'لا يلزم التحقق الثنائي' })
    }

    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) return fromZodError(parsed.error)

    const user = await prisma.user.findFirst({
      where: { id: session.user.id, deletedAt: null, mfaEnabled: true },
      select: {
        id: true,
        role: true,
        email: true,
        piUid: true,
        piUsername: true,
        mfaSecret: true,
        mfaBackupCodes: true,
        isActive: true,
      },
    })

    if (!user?.isActive || !user.mfaSecret) {
      return ok({ error: true, message: 'MFA غير مفعّل' })
    }

    const code = parsed.data.code.replace(/\s/g, '')
    let verified = await verifyStoredTotp(user.mfaSecret, code)

    if (!verified) {
      const backup = await consumeBackupCode(code, user.mfaBackupCodes)
      if (backup.matched) {
        verified = true
        await prisma.user.update({
          where: { id: user.id },
          data: { mfaBackupCodes: backup.remaining },
        })
      }
    }

    if (!verified) {
      return ok({ error: true, message: 'رمز التحقق غير صحيح' })
    }

    await reissueUserSessionCookie(user.id, { mfaJustVerified: true })

    const isProfileComplete = await getProfileCompleteness(user.id, user.role)

    const redirectPath = resolvePostLoginPath({
      user: {
        role: user.role,
        isProfileComplete,
      },
    })

    return ok({ redirectPath })
  } catch (err) {
    console.error('[POST /api/auth/mfa/verify-session]', err)
    return serverError()
  }
}
