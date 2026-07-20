import { TransactionStatus, TransactionType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { sendA2UPayout } from '@/lib/pi/a2u-payout'
import { buildInstantConsultRefundMessage } from '@/lib/payment/instant-consult-refund-split'

const APPOINTMENT_PAYMENT_TYPES = [
  TransactionType.APPOINTMENT_FEE,
  TransactionType.DEPOSIT,
  TransactionType.FINAL_PAYMENT,
] as const

function txNotes(payload: Record<string, unknown>) {
  return JSON.stringify(payload)
}

export type AppointmentRefundResult = {
  refunded: boolean
  amount?: number
  already?: boolean
  creditRefund?: number
  walletRefund?: number
  walletMode?: 'completed' | 'pending' | 'skipped'
}

/** Refund Pi paid for an appointment (deposit and/or full fee) back to the patient. */
export async function refundAppointmentPayments(
  appointmentId: string,
  reason?: string,
): Promise<AppointmentRefundResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      clientId: true,
      doctorId: true,
      isPaid: true,
      isDepositPaid: true,
    },
  })
  if (!appointment) return { refunded: false, already: true }
  if (!appointment.isPaid && !appointment.isDepositPaid) {
    return { refunded: false, already: true }
  }

  const existingRefund = await prisma.transaction.findFirst({
    where: {
      appointmentId,
      type: TransactionType.REFUND,
      status: { in: [TransactionStatus.COMPLETED, TransactionStatus.PENDING] },
    },
  })
  if (existingRefund) return { refunded: false, already: true }

  const paidTxs = await prisma.transaction.findMany({
    where: {
      appointmentId,
      type: { in: [...APPOINTMENT_PAYMENT_TYPES] },
      status: TransactionStatus.COMPLETED,
    },
    orderBy: { createdAt: 'asc' },
  })
  if (paidTxs.length === 0) return { refunded: false, already: true }

  const client = await prisma.user.findUnique({
    where: { id: appointment.clientId },
    select: {
      id: true,
      piUid: true,
      piUsername: true,
      clientProfile: { select: { id: true } },
    },
  })
  if (!client) return { refunded: false, already: true }

  const totalRefund = paidTxs.reduce((sum, tx) => sum + Number(tx.amountTotal), 0)
  if (totalRefund <= 0.0001) return { refunded: false, already: true }

  const pendingRefund = await prisma.transaction.create({
    data: {
      userId: client.id,
      doctorId: appointment.doctorId,
      appointmentId,
      type: TransactionType.REFUND,
      status: TransactionStatus.PENDING,
      amountTotal: totalRefund,
      platformFee: 0,
      receiverAmount: 0,
      notes: txNotes({
        purpose: 'APPOINTMENT_REFUND',
        appointmentId,
        reason: reason ?? null,
        originalTransactionIds: paidTxs.map(t => t.id),
        piUsername: client.piUsername,
        walletMode: 'processing',
      }),
    },
  })

  let walletRefund = totalRefund
  let creditRefund = 0
  let walletMode: 'completed' | 'pending' | 'skipped' = 'skipped'
  let a2uMeta: Record<string, unknown> = {}

  if (walletRefund > 0.0001 && client.piUid) {
    const payout = await sendA2UPayout({
      uid: client.piUid,
      amount: walletRefund,
      memo: 'MRI — استرداد موعد ملغى',
      metadata: { purpose: 'APPOINTMENT_REFUND', appointmentId },
    })

    if (payout.ok && payout.mode === 'completed') {
      walletMode = 'completed'
      a2uMeta = {
        piPaymentId: payout.piPaymentId,
        txHash: payout.txHash,
        toAddress: payout.toAddress ?? null,
      }
    } else if (payout.ok && payout.mode === 'pending') {
      walletMode = 'pending'
      a2uMeta = {
        piPaymentId: payout.piPaymentId,
        toAddress: payout.toAddress ?? null,
      }
    } else {
      creditRefund = walletRefund
      walletRefund = 0
      walletMode = 'skipped'
    }
  } else if (walletRefund > 0.0001) {
    creditRefund = walletRefund
    walletRefund = 0
  }

  const refundStatus =
    walletMode === 'pending' ? TransactionStatus.PENDING : TransactionStatus.COMPLETED

  await prisma.$transaction(async (db) => {
    for (const tx of paidTxs) {
      const receiver = Number(tx.receiverAmount)
      if (tx.doctorId && receiver > 0) {
        const doctor = await db.doctorProfile.findUnique({
          where: { id: tx.doctorId },
          select: { piBalance: true },
        })
        const clawback = Math.min(receiver, Number(doctor?.piBalance ?? 0))
        if (clawback > 0) {
          await db.doctorProfile.update({
            where: { id: tx.doctorId },
            data: { piBalance: { decrement: clawback } },
          })
        }
      }
      await db.transaction.update({
        where: { id: tx.id },
        data: { status: TransactionStatus.REFUNDED },
      })
    }

    if (creditRefund > 0.0001 && client.clientProfile) {
      await db.clientProfile.update({
        where: { id: client.clientProfile.id },
        data: { piCreditBalance: { increment: creditRefund } },
      })
    }

    await db.transaction.update({
      where: { id: pendingRefund.id },
      data: {
        status: refundStatus,
        receiverAmount: walletRefund + creditRefund,
        txHash: (a2uMeta.txHash as string | undefined) ?? undefined,
        notes: txNotes({
          purpose: 'APPOINTMENT_REFUND',
          appointmentId,
          reason: reason ?? null,
          creditRefund,
          walletRefund,
          walletMode,
          originalTransactionIds: paidTxs.map(t => t.id),
          piUsername: client.piUsername,
          refundTransactionId: pendingRefund.id,
          ...a2uMeta,
        }),
      },
    })
  })

  const body = buildInstantConsultRefundMessage({ creditRefund, walletRefund }, walletMode)
  await prisma.notification.create({
    data: {
      userId: client.id,
      title: walletMode === 'pending' ? '💸 استرداد موعد قيد التحويل' : '💰 استرداد موعد',
      body: reason ? `${body} — ${reason}` : body,
      type: 'APPOINTMENT_REFUNDED',
      data: { appointmentId, amount: totalRefund, creditRefund, walletRefund, walletMode },
    },
  }).catch(() => {})

  return {
    refunded: true,
    amount: totalRefund,
    creditRefund,
    walletRefund,
    walletMode,
  }
}
