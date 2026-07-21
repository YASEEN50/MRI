// src/app/api/support/tickets/[id]/route.ts
import { NextRequest } from 'next/server'
import { Role, SupportTicketStatus, TaskPriority } from '@prisma/client'
import { z } from 'zod'
import { requireAuth } from '@/infrastructure/auth/providers/role-guard'
import { requireAdminPermission, ADMIN_PERMISSION_KEYS } from '@/lib/admin/permissions'
import { prisma } from '@/lib/prisma'
import { ok, fromAppError, serverError, badRequest, notFound, forbidden } from '@/lib/api-response'
import { UnauthorizedError } from '@/core/errors'
import { canAccessSupportTicket, isSupportStaff } from '@/lib/support/access'

const PatchSchema = z.object({
  status:     z.enum(['OPEN', 'WAITING_USER', 'WAITING_SUPPORT', 'RESOLVED', 'CLOSED']).optional(),
  priority:   z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return fromAppError(auth.error)

    const { id } = await params
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, piUsername: true, email: true, role: true } },
        assignee: { select: { piUsername: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { piUsername: true, email: true, role: true } } },
        },
      },
    })
    if (!ticket) return notFound('التذكرة غير موجودة')

    const allowed = await canAccessSupportTicket(ticket, auth.context.userId, auth.context.role)
    if (!allowed) return fromAppError(new UnauthorizedError('غير مصرح'))

    return ok({
      id: ticket.id,
      category: ticket.category,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      assignedTo: ticket.assignedTo,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      user: ticket.user,
      assignee: ticket.assignee,
      messages: ticket.messages.map(m => ({
        id: m.id,
        body: m.body,
        isStaffReply: m.isStaffReply,
        createdAt: m.createdAt,
        sender: {
          piUsername: m.sender.piUsername,
          email: m.sender.email,
          role: m.sender.role,
        },
      })),
    })
  } catch (err) {
    console.error('[GET /api/support/tickets/[id]]', err)
    return serverError()
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return fromAppError(auth.error)

    const { id } = await params
    const ticket = await prisma.supportTicket.findUnique({ where: { id } })
    if (!ticket) return notFound('التذكرة غير موجودة')

    const body = await req.json()
    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) return badRequest('بيانات غير صحيحة')

    const staff = await isSupportStaff(auth.context.userId, auth.context.role)
    const isOwner = ticket.userId === auth.context.userId

    if (!staff && !isOwner) {
      return fromAppError(new UnauthorizedError('غير مصرح'))
    }

    if (staff && auth.context.role === Role.ADMIN) {
      const perm = await requireAdminPermission(ADMIN_PERMISSION_KEYS.canManageSupport)
      if (!perm.success) return fromAppError(perm.error)
    }

    const data: {
      status?: SupportTicketStatus
      priority?: TaskPriority
      assignedTo?: string | null
      closedAt?: Date | null
    } = {}

    if (staff) {
      if (parsed.data.status) {
        data.status = parsed.data.status
        if (parsed.data.status === SupportTicketStatus.CLOSED || parsed.data.status === SupportTicketStatus.RESOLVED) {
          data.closedAt = new Date()
        }
      }
      if (parsed.data.priority) data.priority = parsed.data.priority as TaskPriority
      if (parsed.data.assignedTo !== undefined) data.assignedTo = parsed.data.assignedTo
    } else if (parsed.data.status === SupportTicketStatus.CLOSED) {
      data.status = SupportTicketStatus.CLOSED
      data.closedAt = new Date()
    } else {
      return forbidden('يمكنك إغلاق التذكرة فقط')
    }

    const updated = await prisma.supportTicket.update({ where: { id }, data })
    return ok({ id: updated.id, status: updated.status })
  } catch (err) {
    console.error('[PATCH /api/support/tickets/[id]]', err)
    return serverError()
  }
}
