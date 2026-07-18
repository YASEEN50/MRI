import { NextRequest } from 'next/server'
import { z } from 'zod'
import { encode } from 'next-auth/jwt'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { ok, serverError, fromZodError, fromAppError } from '@/lib/api-response'
import { UnauthorizedError } from '@/core/errors'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyStoredTotp, consumeBackupCode } from '@/lib/mfa/totp'
import { getApprovalStatus, getProfileCompleteness } from '@/lib/auth/session-helpers'
import { resolveMfaSessionFlags } from '@/lib/mfa/session-flags'
import { sessionCookieName, sessionCookieOptions, SESSION_MAX_AGE_SEC } from '@/lib/auth/cookie-options'
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

    const isProfileComplete = await getProfileCompleteness(user.id, user.role)
    const approvalStatus = await getApprovalStatus(user.id, user.role)
    const mfaFlags = resolveMfaSessionFlags({
      role: user.role,
      mfaEnabled: true,
      viaMfaToken: true,
    })

    if (!process.env.NEXTAUTH_SECRET) {
      return serverError('NEXTAUTH_SECRET غير مُعدّ')
    }

    const encodedToken = await encode({
      token: {
        sub: user.id,
        id: user.id,
        name: user.piUsername,
        email: user.email,
        role: user.role,
        approvalStatus,
        piUid: user.piUid,
        piUsername: user.piUsername,
        isProfileComplete,
        mfaEnabled: mfaFlags.mfaEnabled,
        mfaVerified: mfaFlags.mfaVerified,
      },
      secret: process.env.NEXTAUTH_SECRET,
      maxAge: SESSION_MAX_AGE_SEC,
    })

    const cookieStore = await cookies()
    cookieStore.set(
      sessionCookieName(),
      encodedToken,
      sessionCookieOptions(SESSION_MAX_AGE_SEC),
    )

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
