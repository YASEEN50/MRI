import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Role, ApprovalStatus } from '@prisma/client'
import { UnauthorizedError } from '@/core/errors'
import { PATIENT_CAPABLE_ROLES } from '@/lib/client/patient-access'

export interface GuardOptions {
  roles?: Role[]
  requireApproved?: boolean
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

  if (!session?.user) {
    return { success: false, error: new UnauthorizedError('يجب تسجيل الدخول أولاً') }
  }

  const { role, id: userId, approvalStatus, piUid } = session.user

  if (options.roles && !options.roles.includes(role)) {
    return { success: false, error: new UnauthorizedError('ليس لديك صلاحية للوصول لهذه الخدمة') }
  }

  if (options.requireApproved && approvalStatus !== ApprovalStatus.APPROVED) {
    return { success: false, error: new UnauthorizedError('حسابك لا يزال قيد المراجعة') }
  }

  return {
    success: true,
    context: { userId, role, approvalStatus, piUid },
  }
}

/** Owner/admin may use patient flows without changing their primary role. */
export async function requirePatientAuth(): Promise<AuthSuccess | AuthFailure> {
  return requireAuth({ roles: PATIENT_CAPABLE_ROLES })
}
