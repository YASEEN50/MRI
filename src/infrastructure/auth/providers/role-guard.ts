import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Role, ApprovalStatus } from '@prisma/client'
import { UnauthorizedError } from '@/core/errors'
import { PATIENT_CAPABLE_ROLES } from '@/lib/client/patient-access'
import { isUserAccountActive } from '@/lib/auth/active-account'
import { requiresMfaRole } from '@/lib/mfa/session-flags'

export interface GuardOptions {
  roles?: Role[]
  requireApproved?: boolean
  /** Require MFA verification for ADMIN/OWNER API access */
  requirePrivilegedMfa?: boolean
}

export interface AuthContext {
  userId: string
  role: Role
  approvalStatus?: ApprovalStatus | null
  piUid?: string | null
}

type AuthSuccess = { success: true; context: AuthContext }
type AuthFailure = { success: false; error: UnauthorizedError }

export type { AuthSuccess, AuthFailure }

export async function requireAuth(
  options: GuardOptions = {}
): Promise<AuthSuccess | AuthFailure> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { success: false, error: new UnauthorizedError('يجب تسجيل الدخول أولاً') }
  }

  const { role, id: userId, approvalStatus, piUid } = session.user

  if (!(await isUserAccountActive(userId))) {
    return { success: false, error: new UnauthorizedError('تم تجميد حسابك — تواصل مع الدعم') }
  }

  if (options.roles && !options.roles.includes(role)) {
    return { success: false, error: new UnauthorizedError('ليس لديك صلاحية للوصول لهذه الخدمة') }
  }

  if (options.requireApproved && approvalStatus !== ApprovalStatus.APPROVED) {
    return { success: false, error: new UnauthorizedError('حسابك لا يزال قيد المراجعة') }
  }

  if (
    options.requirePrivilegedMfa &&
    requiresMfaRole(role) &&
    (!session.user.mfaEnabled || !session.user.mfaVerified)
  ) {
    return { success: false, error: new UnauthorizedError('يلزم إكمال التحقق الثنائي') }
  }

  return {
    success: true,
    context: { userId, role, approvalStatus, piUid },
  }
}

/** Owner-only API routes (MFA required when enabled). */
export async function requireOwnerAuth(): Promise<AuthSuccess | AuthFailure> {
  return requireAuth({ roles: [Role.OWNER], requirePrivilegedMfa: true })
}

/** Admin/owner API routes (MFA required when enabled). */
export async function requirePrivilegedAuth(): Promise<AuthSuccess | AuthFailure> {
  return requireAuth({ roles: [Role.ADMIN, Role.OWNER], requirePrivilegedMfa: true })
}

/** Owner/admin may use patient flows without changing their primary role. */
export async function requirePatientAuth(): Promise<AuthSuccess | AuthFailure> {
  return requireAuth({ roles: PATIENT_CAPABLE_ROLES })
}
