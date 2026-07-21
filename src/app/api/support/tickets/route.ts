// src/app/api/support/tickets/route.ts
import { NextRequest } from 'next/server'
import { Role, SupportTicketStatus } from '@prisma/client'
import { z } from 'zod'
import { requireAuth } from '@/infrastructure/auth/providers/role-guard'
import { requireAdminPermission, ADMIN_PERMISSION_KEYS } from '@/lib/admin/permissions'
import { prisma } from '@/lib/prisma'
import { ok, created, fromAppError, serverError } from '@/lib/api-response'
import { parsePagination } from '@/lib/api-pagination'
import { isSupportStaff } from '@/lib/support/access'
import { notifySupportStaffNewTicket } from '@/lib/support/notify'

const CreateSchema = z.object({
  category: z.enum(['ACCOUNT', 'PAYMENT', 'VERIFICATION', 'APPOINTMENT', 'TECHNICAL', 'OTHER']),
  subject:  z.string().min(3).max(200),
  body:     z.string().min(5).max(5000),
})

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return fromAppError(auth.error)

    const { userId, role } = auth.context
    const staff = await isSupportStaff(userId, role)
    const status = req.nextUrl.searchParams.get('status')
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams, { limit: 20, maxLimit: 100 })

    const where: Record<string, unknown> = {}
    if (!staff) {
      where.userId = userId
    } else if (role === Role.ADMIN) {
      const perm = await requireAdminPermission(ADMIN_PERMISSION_KEYS.canManageSupport)
      if (!perm.success) return fromAppError(perm.error)
    }
    if (status && status !== 'all') where.status = status as SupportTicketStatus

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { piUsername: true, email: true, role: true } },
          assignee: { select: { piUsername: true, email: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, createdAt: true, isStaffReply: true } },
        },
      }),
      prisma.supportTicket.count({ where }),
    ])

    return ok(
      tickets.map(t => ({
        id: t.id,
        category: t.category,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        assignedTo: t.assignedTo,
        lastReplyAt: t.lastReplyAt,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        user: {
          piUsername: t.user.piUsername,
          email: t.user.email,
          role: t.user.role,
        },
        assignee: t.assignee
          ? { piUsername: t.assignee.piUsername, email: t.assignee.email }
          : null,
        lastMessage: t.messages[0] ?? null,
      })),
      { total, page, limit },
    )
  } catch (err) {
    console.error('[GET /api/support/tickets]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return fromAppError(auth.error)

    const body = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) return ok({ error: true, message: 'بيانات غير صحيحة' })

    const ticket = await prisma.$transaction(async tx => {
      const row = await tx.supportTicket.create({
        data: {
          userId: auth.context.userId,
          category: parsed.data.category,
          subject: parsed.data.subject,
          status: SupportTicketStatus.WAITING_SUPPORT,
          lastReplyAt: new Date(),
        },
      })
      await tx.supportTicketMessage.create({
        data: {
          ticketId: row.id,
          senderId: auth.context.userId,
          body: parsed.data.body,
          isStaffReply: false,
        },
      })
      return row
    })

    notifySupportStaffNewTicket(ticket.id, ticket.subject).catch(console.error)

    return created({ id: ticket.id })
  } catch (err) {
    console.error('[POST /api/support/tickets]', err)
    return serverError()
  }
}
