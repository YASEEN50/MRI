import { prisma } from '@/lib/prisma'
import { listSupportStaffUserIds } from '@/lib/support/access'

export async function notifySupportStaffNewTicket(ticketId: string, subject: string) {
  const staffIds = await listSupportStaffUserIds()
  if (!staffIds.length) return

  await prisma.notification.createMany({
    data: staffIds.map(userId => ({
      userId,
      title: '🎫 تذكرة دعم جديدة',
      body: subject.slice(0, 120),
      type: 'SUPPORT_TICKET_NEW',
      data: { ticketId },
    })),
  })
}

export async function notifyTicketUserReply(ticketId: string, userId: string, preview: string) {
  await prisma.notification.create({
    data: {
      userId,
      title: '💬 رد من فريق الدعم',
      body: preview.slice(0, 120),
      type: 'SUPPORT_TICKET_REPLY',
      data: { ticketId },
    },
  })
}

export async function notifySupportStaffUserReply(ticketId: string, subject: string, preview: string) {
  const staffIds = await listSupportStaffUserIds()
  if (!staffIds.length) return

  await prisma.notification.createMany({
    data: staffIds.map(userId => ({
      userId,
      title: '📩 رد مستخدم على تذكرة',
      body: `${subject.slice(0, 40)} — ${preview.slice(0, 60)}`,
      type: 'SUPPORT_TICKET_USER_REPLY',
      data: { ticketId },
    })),
  })
}
