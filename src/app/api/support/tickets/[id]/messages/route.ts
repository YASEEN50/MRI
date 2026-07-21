// src/app/api/support/tickets/[id]/messages/route.ts
import { NextRequest } from 'next/server'
import { Role, SupportTicketStatus } from '@prisma/client'
import { z } from 'zod'
import { requireAuth } from '@/infrastructure/auth/providers/role-guard'
import { requireAdminPermission, ADMIN_PERMISSION_KEYS } from '@/lib/admin/permissions'
import { prisma } from '@/lib/prisma'
import { ok, created, fromAppError, serverError, badRequest, notFound, forbidden } from '@/lib/api-response'
import { enforceChatRateLimit } from '@/lib/enforce-api-rate-limit'
import { UnauthorizedError } from '@/core/errors'
import { canAccessSupportTicket, isSupportStaff, userMayReply } from '@/lib/support/access'
import { notifySupportStaffUserReply, notifyTicketUserReply } from '@/lib/support/notify'

const MessageSchema = z.object({
  body: z.string().min(1).max(5000),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const limited = await enforceChatRateLimit(req)
    if (limited) return limited

    const auth = await requireAuth()
    if (!auth.success) return fromAppError(auth.error)

    const { id } = await params
    const ticket = await prisma.supportTicket.findUnique({ where: { id } })
    if (!ticket) return notFound('التذكرة غير موجودة')

    const allowed = await canAccessSupportTicket(ticket, auth.context.userId, auth.context.role)
    if (!allowed) return fromAppError(new UnauthorizedError('غير مصرح'))

    if (!userMayReply(ticket.status)) {
      return badRequest('التذكرة مغلقة — افتح تذكرة جديدة إن لزم')
    }

    const body = await req.json()
    const parsed = MessageSchema.safeParse(body)
    if (!parsed.success) return badRequest('الرسالة فارغة')

    const staff = await isSupportStaff(auth.context.userId, auth.context.role)
    if (staff && auth.context.role === Role.ADMIN) {
      const perm = await requireAdminPermission(ADMIN_PERMISSION_KEYS.canManageSupport)
      if (!perm.success) return fromAppError(perm.error)
    }

    const message = await prisma.$transaction(async tx => {
      const msg = await tx.supportTicketMessage.create({
        data: {
          ticketId: id,
          senderId: auth.context.userId,
          body: parsed.data.body,
          isStaffReply: staff,
        },
      })
      await tx.supportTicket.update({
        where: { id },
        data: {
          lastReplyAt: new Date(),
          status: staff ? SupportTicketStatus.WAITING_USER : SupportTicketStatus.WAITING_SUPPORT,
          ...(staff && !ticket.assignedTo ? { assignedTo: auth.context.userId } : {}),
        },
      })
      return msg
    })

    if (staff) {
      notifyTicketUserReply(id, ticket.userId, parsed.data.body).catch(console.error)
    } else {
      notifySupportStaffUserReply(id, ticket.subject, parsed.data.body).catch(console.error)
    }

    return created({
      id: message.id,
      createdAt: message.createdAt,
    })
  } catch (err) {
    console.error('[POST /api/support/tickets/[id]/messages]', err)
    return serverError()
  }
}
