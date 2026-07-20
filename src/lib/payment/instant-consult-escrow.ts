import { TransactionStatus, TransactionType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { settleDoctorPayment, splitDoctorPayment } from '@/lib/payment/platform-fee'
import {
  buildInstantConsultRefundMessage,
  splitInstantConsultRefund,
} from '@/lib/payment/instant-consult-refund-split'
import { sendA2UPayout } from '@/lib/pi/a2u-payout'

function parseNotes(notes: string | null): Record<string, unknown> {
  try {
    return JSON.parse(notes ?? '{}') as Record<string, unknown>
  } catch {
    return {}
  }
}

function txNotes(payload: Record<string, unknown>) {
  return JSON.stringify(payload)
}

export async function findInstantConsultTransaction(instantConsultId: string) {
  const request = await prisma.instantConsultRequest.findUnique({
    where: { id: instantConsultId },
    select: { transactionId: true },
  })

  if (request?.transactionId) {
    const byId = await prisma.transaction.findUnique({
      where: { id: request.transactionId },
    })
    if (byId) return byId
  }

  return prisma.transaction.findFirst({
    where: {
      type: TransactionType.INSTANT_CONSULT,
      status: { in: [TransactionStatus.COMPLETED, TransactionStatus.REFUNDED] },
      notes: { contains: instantConsultId },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/** Pay doctor only after the consult is accepted (escrow until accept). */
export async function settleInstantConsultOnAccept(instantConsultId: string): Promise<void> {
  const request = await prisma.instantConsultRequest.findUnique({
    where: { id: instantConsultId },
    select: { doctorId: true, fee: true },
  })

  const tx = await findInstantConsultTransaction(instantConsultId)
  if (!tx || tx.status !== TransactionStatus.COMPLETED) return

  const doctorId = request?.doctorId ?? tx.doctorId
  if (doctorId && !tx.doctorId) {
    await prisma.transaction.update({
      where: { id: tx.id },
      data: { doctorId },
    })
    tx.doctorId = doctorId
  }

  const meta = parseNotes(tx.notes)
  if (meta.doctorSettled === true) return

  const totalFee = Number(request?.fee ?? tx.amountTotal)
  const { platformFee, receiverAmount } = splitDoctorPayment(totalFee)

  await settleDoctorPayment({
    id: tx.id,
    doctorId: tx.doctorId,
    receiverAmount,
    platformFee,
    amountTotal: totalFee,
  })
  await prisma.transaction.update({
    where: { id: tx.id },
    data: { notes: txNotes({ ...meta, doctorSettled: true }) },
  })
}

export type InstantConsultRefundResult = {
  refunded: boolean
  amount?: number
  already?: boolean
  creditRefund?: number
  walletRefund?: number
  walletMode?: 'completed' | 'pending' | 'skipped'
}

/**
 * Refund instant consult: credit portion → piCreditBalance; Pi portion → A2U wallet when possible.
 */
export async function refundInstantConsultPayment(
  instantConsultId: string,
): Promise<InstantConsultRefundResult> {
  const request = await prisma.instantConsultRequest.findUnique({
    where: { id: instantConsultId },
    include: {
      client: {
        select: {
          id: true,
          userId: true,
          user: { select: { piUid: true, piUsername: true } },
        },
      },
    },
  })
  if (!request?.isPaid) return { refunded: false, already: true }

  const tx = await findInstantConsultTransaction(instantConsultId)

  const existingRefund = await prisma.transaction.findFirst({
    where: {
      type: TransactionType.REFUND,
      status: { in: [TransactionStatus.COMPLETED, TransactionStatus.PENDING] },
      notes: { contains: instantConsultId },
    },
  })
  if (existingRefund || tx?.status === TransactionStatus.REFUNDED) {
    return { refunded: false, already: true }
  }

  const meta = tx ? parseNotes(tx.notes) : {}
  const fee = Number(request.fee)
  const creditApplied = Number(request.creditApplied ?? 0)
  const paidWithCreditOnly = meta.paidWithCredit === true

  let split = splitInstantConsultRefund({
    fee,
    creditApplied,
    piTransactionTotal: tx ? Number(tx.amountTotal) : null,
    paidWithCreditOnly,
  })

  const pendingRefund = await prisma.transaction.create({
    data: {
      userId: request.client.userId,
      doctorId: tx?.doctorId ?? null,
      type: TransactionType.REFUND,
      status: TransactionStatus.PENDING,
      amountTotal: fee,
      platformFee: 0,
      receiverAmount: 0,
      notes: txNotes({
        purpose: 'INSTANT_CONSULT_REFUND',
        instantConsultId,
        originalTransactionId: tx?.id ?? null,
        creditApplied,
        creditRefund: split.creditRefund,
        walletRefund: split.walletRefund,
        walletMode: 'processing',
        piUsername: request.client.user.piUsername,
      }),
    },
  })

  let walletMode: 'completed' | 'pending' | 'skipped' = 'skipped'
  let a2uMeta: Record<string, unknown> = {}

  const piUid = request.client.user.piUid
  if (split.walletRefund > 0.0001 && piUid) {
    const payout = await sendA2UPayout({
      uid: piUid,
      amount: split.walletRefund,
      memo: 'MRI — استرداد استشارة فورية',
      metadata: { purpose: 'INSTANT_CONSULT_REFUND', instantConsultId },
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
      split = {
        creditRefund: split.creditRefund + split.walletRefund,
        walletRefund: 0,
      }
      walletMode = 'skipped'
    }
  } else if (split.walletRefund > 0.0001) {
    split = {
      creditRefund: split.creditRefund + split.walletRefund,
      walletRefund: 0,
    }
  }

  const receiver = tx ? Number(tx.receiverAmount) : 0
  const refundStatus =
    walletMode === 'pending' ? TransactionStatus.PENDING : TransactionStatus.COMPLETED

  await prisma.$transaction(async (db) => {
    if (meta.doctorSettled === true && tx?.doctorId && receiver > 0) {
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

    if (split.creditRefund > 0.0001) {
      await db.clientProfile.update({
        where: { id: request.clientId },
        data: { piCreditBalance: { increment: split.creditRefund } },
      })
    }

    await db.transaction.update({
      where: { id: pendingRefund.id },
      data: {
        status: refundStatus,
        receiverAmount: split.walletRefund + split.creditRefund,
        txHash: (a2uMeta.txHash as string | undefined) ?? undefined,
        notes: txNotes({
          purpose: 'INSTANT_CONSULT_REFUND',
          instantConsultId,
          originalTransactionId: tx?.id ?? null,
          creditApplied,
          creditRefund: split.creditRefund,
          walletRefund: split.walletRefund,
          walletMode,
          piUsername: request.client.user.piUsername,
          refundTransactionId: pendingRefund.id,
          ...a2uMeta,
        }),
      },
    })

    if (tx) {
      await db.transaction.update({
        where: { id: tx.id },
        data: { status: TransactionStatus.REFUNDED },
      })
    }
  })

  const body = buildInstantConsultRefundMessage(split, walletMode)

  await prisma.notification.create({
    data: {
      userId: request.client.userId,
      title: walletMode === 'pending' ? '💸 استرداد قيد التحويل' : '💰 تم استرداد المبلغ',
      body,
      type: 'INSTANT_CONSULT_REFUNDED',
      data: {
        instantConsultId,
        amount: fee,
        creditRefund: split.creditRefund,
        walletRefund: split.walletRefund,
        walletMode,
      },
    },
  })

  return {
    refunded: true,
    amount: fee,
    creditRefund: split.creditRefund,
    walletRefund: split.walletRefund,
    walletMode,
  }
}

export async function linkInstantConsultTransaction(
  instantConsultId: string,
  transactionId: string,
): Promise<void> {
  await prisma.instantConsultRequest.update({
    where: { id: instantConsultId },
    data: { transactionId },
  })
}

export function mapPatientRefundRow(r: {
  id: string
  amountTotal: { toString(): string } | number
  status: TransactionStatus
  txHash: string | null
  notes: string | null
  createdAt: Date
  user?: { piUsername: string | null; email: string | null }
}) {
  const meta = parseNotes(r.notes)
  return {
    id: r.id,
    amount: Number(meta.walletRefund ?? r.amountTotal),
    creditRefund: Number(meta.creditRefund ?? 0),
    status: r.status,
    piPaymentId: (meta.piPaymentId as string | null) ?? null,
    toAddress: (meta.toAddress as string | null) ?? null,
    txHash: r.txHash,
    instantConsultId: (meta.instantConsultId as string | null) ?? null,
    appointmentId: (meta.appointmentId as string | null) ?? null,
    piUsername: (meta.piUsername as string | null) ?? r.user?.piUsername ?? null,
    createdAt: r.createdAt.toISOString(),
    patientContact: r.user?.piUsername ?? r.user?.email ?? undefined,
  }
}

export async function listPendingPatientRefunds() {
  const rows = await prisma.transaction.findMany({
    where: {
      type: TransactionType.REFUND,
      status: TransactionStatus.PENDING,
      OR: [
        { notes: { contains: 'INSTANT_CONSULT_REFUND' } },
        { notes: { contains: 'APPOINTMENT_REFUND' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: { select: { piUsername: true, email: true } },
    },
  })
  return rows.map(mapPatientRefundRow)
}

export async function completePatientRefundByAdmin(
  transactionId: string,
  txHash: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const row = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { user: { select: { id: true } } },
  })
  if (!row || row.type !== TransactionType.REFUND || row.status !== TransactionStatus.PENDING) {
    return { ok: false, message: 'طلب الاسترداد غير موجود أو مكتمل' }
  }

  const meta = parseNotes(row.notes)
  const piPaymentId = meta.piPaymentId as string | undefined
  if (!piPaymentId) return { ok: false, message: 'معرف دفع Pi غير موجود' }

  const { completeA2UPayout } = await import('@/lib/pi/a2u-payout')
  const done = await completeA2UPayout(piPaymentId, txHash)
  if (!done.ok) return done

  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: TransactionStatus.COMPLETED,
      txHash: txHash.trim(),
      notes: txNotes({ ...meta, walletMode: 'completed' }),
    },
  })

  if (row.userId) {
    await prisma.notification.create({
      data: {
        userId: row.userId,
        title: '✅ وصل الاسترداد إلى محفظة Pi',
        body: `تم تحويل ${Number(meta.walletRefund ?? row.amountTotal).toFixed(4)} π إلى محفظتك`,
        type: 'INSTANT_CONSULT_REFUNDED',
        data: {
          transactionId,
          instantConsultId: String(meta.instantConsultId ?? ''),
        },
      },
    })
  }

  return { ok: true }
}
