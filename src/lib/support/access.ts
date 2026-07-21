import { Role, SupportTicketStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hasAdminPermission } from '@/lib/admin/permissions'
import { ADMIN_PERMISSION_KEYS } from '@/lib/admin/permissions'

export async function isSupportStaff(userId: string, role: Role): Promise<boolean> {
  if (role === Role.OWNER) return true
  if (role !== Role.ADMIN) return false
  return hasAdminPermission(userId, role, ADMIN_PERMISSION_KEYS.canManageSupport)
}

export async function canAccessSupportTicket(
  ticket: { userId: string; assignedTo: string | null },
  userId: string,
  role: Role,
): Promise<boolean> {
  if (ticket.userId === userId) return true
  return isSupportStaff(userId, role)
}

export function userMayReply(status: SupportTicketStatus): boolean {
  return status !== SupportTicketStatus.CLOSED && status !== SupportTicketStatus.RESOLVED
}

export async function listSupportStaffUserIds(): Promise<string[]> {
  const owners = await prisma.user.findMany({
    where: { role: Role.OWNER, deletedAt: null, isActive: true },
    select: { id: true },
  })
  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN, deletedAt: null, isActive: true },
    select: { id: true },
  })

  const staff: string[] = owners.map(o => o.id)
  for (const admin of admins) {
    if (await hasAdminPermission(admin.id, Role.ADMIN, ADMIN_PERMISSION_KEYS.canManageSupport)) {
      staff.push(admin.id)
    }
  }
  return [...new Set(staff)]
}
