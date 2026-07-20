import { encode } from 'next-auth/jwt'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { resolveMfaSessionFlags } from '@/lib/mfa/session-flags'
import { getApprovalStatus, getProfileCompleteness } from '@/lib/auth/session-helpers'
import { sessionCookieName, sessionCookieOptions, SESSION_MAX_AGE_SEC } from '@/lib/auth/cookie-options'
import { isUserAccountActive } from '@/lib/auth/active-account'

/** Re-issue NextAuth session JWT after server-verified MFA (enable or login challenge). */
export async function reissueUserSessionCookie(
  userId: string,
  options: { mfaJustVerified: boolean },
): Promise<void> {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET غير مُعدّ')
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      role: true,
      email: true,
      piUid: true,
      piUsername: true,
      mfaEnabled: true,
    },
  })
  if (!user || !(await isUserAccountActive(user.id))) {
    throw new Error('المستخدم غير موجود أو مجمّد')
  }

  const isProfileComplete = await getProfileCompleteness(user.id, user.role)
  const approvalStatus = await getApprovalStatus(user.id, user.role)
  const mfaFlags = resolveMfaSessionFlags({
    role: user.role,
    mfaEnabled: user.mfaEnabled,
    viaMfaToken: options.mfaJustVerified,
  })

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
      isActive: true,
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
}
