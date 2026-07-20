import {
  AppointmentStatus,
  InstantConsultStatus,
  Role,
} from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { cancelRemindersForAppointment } from '@/lib/cron/reminders.service'
import { notifyAppointmentCancelled } from '@/lib/appointments/notifications'
import { refundAppointmentPayments } from '@/lib/payment/appointment-refund'
import { refundInstantConsultPayment } from '@/lib/payment/instant-consult-escrow'
import { buildInstantConsultRefundMessage } from '@/lib/payment/instant-consult-refund-split'

export type SuspendEnforcementStats = {
  cancelledAppointments: number
  refundedAppointments: number
  cancelledConsults: number
  refundedConsults: number
}

const DEFAULT_CANCEL_REASON = 'تم إلغاء الموعد بسبب تجميد حساب مقدم الخدمة'

async function disableDoctorPractice(doctorId: string): Promise<void> {
  await prisma.availability.updateMany({
    where: { doctorId },
    data: { isActive: false, updatedAt: new Date() },
  })
  await prisma.doctorProfile.update({
    where: { id: doctorId },
    data: {
      isOnlineForInstant: false,
      updatedAt: new Date(),
    },
  })
}

async function cancelProviderAppointments(params: {
  doctorId?: string
  facilityId?: string
  cancelledBy: string
  reason: string
}): Promise<{ cancelled: number; refunded: number }> {
  const appointments = await prisma.appointment.findMany({
    where: {
      deletedAt: null,
      status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      ...(params.doctorId ? { doctorId: params.doctorId } : { facilityId: params.facilityId }),
    },
    select: { id: true },
  })

  let cancelled = 0
  let refunded = 0

  for (const apt of appointments) {
    await prisma.appointment.update({
      where: { id: apt.id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelReason: params.reason || DEFAULT_CANCEL_REASON,
        cancelledBy: params.cancelledBy,
        updatedAt: new Date(),
      },
    })
    cancelled++
    cancelRemindersForAppointment(apt.id).catch(() => {})
    notifyAppointmentCancelled(apt.id).catch(() => {})

    const result = await refundAppointmentPayments(apt.id, params.reason)
    if (result.refunded) refunded++
  }

  return { cancelled, refunded }
}

async function cancelDoctorInstantConsults(
  doctorId: string,
  reason: string,
): Promise<{ cancelled: number; refunded: number }> {
  const consults = await prisma.instantConsultRequest.findMany({
    where: {
      doctorId,
      status: { in: [InstantConsultStatus.PENDING, InstantConsultStatus.ACCEPTED] },
    },
    select: { id: true, status: true, isPaid: true, clientId: true },
  })

  let cancelled = 0
  let refunded = 0

  for (const consult of consults) {
    await prisma.instantConsultRequest.update({
      where: { id: consult.id },
      data: {
        status: InstantConsultStatus.CANCELLED,
        ...(consult.status === InstantConsultStatus.PENDING
          ? { rejectedAt: new Date() }
          : {}),
        updatedAt: new Date(),
      },
    })
    cancelled++

    if (!consult.isPaid) continue

    const refund = await refundInstantConsultPayment(consult.id)
    if (refund.refunded) {
      refunded++
      const client = await prisma.clientProfile.findUnique({
        where: { id: consult.clientId },
        select: { userId: true },
      })
      if (client) {
        await prisma.notification.create({
          data: {
            userId: client.userId,
            title: '⛔ أُلغيت الاستشارة الفورية',
            body: refund.amount
              ? `بسبب تجميد حساب الطبيب — ${buildInstantConsultRefundMessage(
                  {
                    creditRefund: refund.creditRefund ?? 0,
                    walletRefund: refund.walletRefund ?? 0,
                  },
                  refund.walletMode ?? 'skipped',
                )}`
              : 'بسبب تجميد حساب الطبيب — جرّب طبيباً آخر',
            type: 'INSTANT_CONSULT_CANCELLED',
            data: { requestId: consult.id, reason },
          },
        }).catch(() => {})
      }
    }
  }

  return { cancelled, refunded }
}

/** Cancel upcoming services and refund patients when a provider account is suspended. */
export async function applyAccountSuspendEnforcement(
  userId: string,
  actorId: string,
  reason: string,
): Promise<SuspendEnforcementStats> {
  const stats: SuspendEnforcementStats = {
    cancelledAppointments: 0,
    refundedAppointments: 0,
    cancelledConsults: 0,
    refundedConsults: 0,
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      role: true,
      doctorProfile: { select: { id: true } },
      facilityProfile: { select: { id: true } },
    },
  })
  if (!user) return stats

  if (user.role === Role.DOCTOR && user.doctorProfile) {
    await disableDoctorPractice(user.doctorProfile.id)

    const apptStats = await cancelProviderAppointments({
      doctorId: user.doctorProfile.id,
      cancelledBy: actorId,
      reason,
    })
    stats.cancelledAppointments += apptStats.cancelled
    stats.refundedAppointments += apptStats.refunded

    const consultStats = await cancelDoctorInstantConsults(user.doctorProfile.id, reason)
    stats.cancelledConsults += consultStats.cancelled
    stats.refundedConsults += consultStats.refunded
  }

  if (user.role === Role.FACILITY && user.facilityProfile) {
    await prisma.availability.updateMany({
      where: { facilityId: user.facilityProfile.id },
      data: { isActive: false, updatedAt: new Date() },
    })

    const apptStats = await cancelProviderAppointments({
      facilityId: user.facilityProfile.id,
      cancelledBy: actorId,
      reason,
    })
    stats.cancelledAppointments += apptStats.cancelled
    stats.refundedAppointments += apptStats.refunded
  }

  return stats
}
