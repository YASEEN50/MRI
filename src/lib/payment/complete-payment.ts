import { PremioType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  fulfillAppointmentPayment,
  fulfillInstantConsultPayment,
  fulfillPremioPurchase,
} from '@/lib/payment/fulfill'
import { fulfillPaidAdPayment } from '@/lib/payment/fulfill-paid-ad'
import { settleDoctorPayment } from '@/lib/payment/platform-fee'

type PaymentMeta = {
  purpose?: string
  planType?: PremioType
  appointmentId?: string
  paymentType?: 'FULL' | 'DEPOSIT'
  transactionType?: 'APPOINTMENT_FEE' | 'DEPOSIT' | 'FINAL_PAYMENT' | 'INSTANT_CONSULT'
  instantConsultId?: string
  adId?: string
}

function parseMeta(notes: string | null): PaymentMeta {
  try {
    return JSON.parse(notes ?? '{}') as PaymentMeta
  } catch {
    return {}
  }
}

/** Fulfill order + doctor settlement before marking transaction COMPLETED. */
export async function finalizeCompletedPiPayment(params: {
  userId: string
  transaction: {
    id: string
    doctorId: string | null
    amountTotal: { toString(): string } | number
    platformFee: { toString(): string } | number
    receiverAmount: { toString(): string } | number
    notes: string | null
  }
  txHash: string
  piPaymentId: string
}): Promise<{ message: string; extra?: Record<string, unknown> }> {
  const { userId, transaction, txHash, piPaymentId } = params
  const meta = parseMeta(transaction.notes)

  if (meta.purpose === 'PREMIO' && meta.planType) {
    const premio = await fulfillPremioPurchase(
      userId,
      meta.planType,
      Number(transaction.amountTotal),
      txHash,
      transaction.id,
    )
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED', txHash },
    })
    return {
      message: 'تم الدفع وتفعيل البريميو بنجاح 💎',
      extra: { premioId: premio.id, txHash },
    }
  }

  if (meta.purpose === 'APPOINTMENT' && meta.appointmentId && meta.paymentType) {
    const txType = meta.transactionType ?? 'APPOINTMENT_FEE'
    if (txType === 'INSTANT_CONSULT') {
      throw new Error('نوع الدفع غير معروف')
    }
    await fulfillAppointmentPayment(
      meta.appointmentId,
      meta.paymentType,
      txType,
      userId,
      Number(transaction.amountTotal),
      transaction.id,
      Number(transaction.platformFee),
      Number(transaction.receiverAmount),
    )
    if (transaction.doctorId) {
      await settleDoctorPayment(transaction)
    }
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED', txHash },
    })
    return {
      message: 'تم الدفع بنجاح',
      extra: { appointmentId: meta.appointmentId, txHash },
    }
  }

  if (meta.purpose === 'INSTANT_CONSULT' && meta.instantConsultId) {
    await fulfillInstantConsultPayment(
      meta.instantConsultId,
      userId,
      Number(transaction.amountTotal),
      transaction.id,
    )
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED', txHash },
    })
    return {
      message: 'تم الدفع — بانتظار قبول الطبيب',
      extra: { instantConsultId: meta.instantConsultId, txHash },
    }
  }

  if (meta.purpose === 'PAID_AD' && meta.adId) {
    await fulfillPaidAdPayment(
      meta.adId,
      userId,
      Number(transaction.amountTotal),
      txHash,
      piPaymentId,
      transaction.id,
    )
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED', txHash },
    })
    return {
      message: 'تم الدفع — بانتظار مراجعة الإعلان',
      extra: { adId: meta.adId, txHash },
    }
  }

  throw new Error('نوع الدفع غير معروف')
}
