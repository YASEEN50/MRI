import { Role } from '@prisma/client'
import { requireAuth } from '@/infrastructure/auth/providers/role-guard'
import { requireAdminPermission, ADMIN_PERMISSION_KEYS } from '@/lib/admin/permissions'
import { ok, fromAppError, serverError, forbidden } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { isSupportStaff } from '@/lib/support/access'

export async function GET() {
  try {
    const auth = await requireAuth()
    if (!auth.success) return fromAppError(auth.error)

    const staff = await isSupportStaff(auth.context.userId, auth.context.role)
    if (!staff) return forbidden('غير مصرح')

    if (auth.context.role === Role.ADMIN) {
      const perm = await requireAdminPermission(ADMIN_PERMISSION_KEYS.canManageSupport)
      if (!perm.success) return fromAppError(perm.error)
    }

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        role: { in: [Role.OWNER, Role.ADMIN] },
      },
      select: { id: true, piUsername: true, email: true, role: true },
      orderBy: { role: 'asc' },
    })

    const eligible = []
    for (const user of users) {
      if (user.role === Role.OWNER) {
        eligible.push(user)
        continue
      }
      if (await isSupportStaff(user.id, user.role)) {
        eligible.push(user)
      }
    }

    return ok(
      eligible.map(u => ({
        id: u.id,
        label: u.piUsername ? `@${u.piUsername}` : (u.email ?? u.id.slice(0, 8)),
        role: u.role,
      })),
    )
  } catch (err) {
    console.error('[GET /api/support/staff]', err)
    return serverError()
  }
}
