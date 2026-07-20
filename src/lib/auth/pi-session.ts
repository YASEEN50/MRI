import { encode } from 'next-auth/jwt'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { verifyPiAccessToken } from '@/lib/pi/verify-access-token'
import { resolvePiLoginUser } from '@/lib/auth/account-linking'
import { resolveMfaSessionFlags } from '@/lib/mfa/session-flags'
import { prisma } from '@/lib/prisma'
import { resolvePostLoginPath } from '@/lib/pi/pi-post-login-path'
import { SESSION_MAX_AGE_SEC } from '@/lib/auth/cookie-options'
import { getApprovalStatus, getProfileCompleteness } from '@/lib/auth/session-helpers'

export type EstablishPiSessionResult =
  | {
      ok: true
      encodedToken: string
      redirectPath: string
      mfaRequired: boolean
      user: {
        id: string
        role: Role
        isProfileComplete: boolean
        piUsername: string | null
        email: string | null
      }
    }
  | { ok: false; code: string; message: string; status: number }

const REGISTERABLE_ROLES = ['CLIENT', 'DOCTOR', 'FACILITY'] as const

export async function establishPiSession(
  accessToken: string,
  options?: { roleOnCreate?: (typeof REGISTERABLE_ROLES)[number] },
): Promise<EstablishPiSessionResult> {
  if (!process.env.NEXTAUTH_SECRET) {
    return {
      ok: false,
      code: 'SERVER_MISCONFIGURED',
      message: 'NEXTAUTH_SECRET غير مُعدّ على الخادم',
      status: 500,
    }
  }

  const piUser = await verifyPiAccessToken(accessToken)
  if (!piUser) {
    return {
      ok: false,
      code: 'INVALID_PI_TOKEN',
      message: 'فشل التحقق من حساب Pi Network — تأكد من فتح التطبيق داخل Pi Browser',
      status: 401,
    }
  }

  const { user } = await resolvePiLoginUser(piUser, {
    roleOnCreate: options?.roleOnCreate,
  })

  if (!user.isActive) {
    return {
      ok: false,
      code: 'ACCOUNT_DISABLED',
      message: 'تم تعليق هذا الحساب',
      status: 403,
    }
  }

  const isProfileComplete = await getProfileCompleteness(user.id, user.role)
  const approvalStatus = await getApprovalStatus(user.id, user.role)
  const mfaFlags = resolveMfaSessionFlags({
    role: user.role,
    mfaEnabled: user.mfaEnabled ?? false,
    viaMfaToken: false,
  })

  const encodedToken = await encode({
    token: {
      sub: user.id,
      id: user.id,
      name: user.piUsername ?? piUser.username,
      email: user.email,
      role: user.role,
      approvalStatus,
      piUid: user.piUid,
      piUsername: user.piUsername,
      isProfileComplete,
      isActive: true,
      mfaEnabled: mfaFlags.mfaEnabled,
      mfaVerified: mfaFlags.mfaVerified,
    },
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: SESSION_MAX_AGE_SEC,
  })

  const sessionUser = {
    id: user.id,
    role: user.role,
    isProfileComplete,
    piUsername: user.piUsername,
    email: user.email,
  }

  const mfaRequired = mfaFlags.mfaEnabled && !mfaFlags.mfaVerified
  let redirectPath = resolvePostLoginPath({ user: sessionUser })
  if (mfaRequired) {
    redirectPath = '/login/mfa'
  }

  return {
    ok: true,
    encodedToken,
    redirectPath,
    mfaRequired,
    user: sessionUser,
  }
}

export const PiSessionBodySchema = z.object({
  accessToken: z.string().min(1),
  role: z.enum(REGISTERABLE_ROLES).optional(),
})
