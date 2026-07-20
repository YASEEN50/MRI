import { Role, PremioType, AdPlan, PaidAdStatus, InstantConsultStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { piPaymentService } from '@/infrastructure/pi-network/pi-payment.service'
import { splitDoctorPayment, splitPremioPayment } from '@/lib/payment/platform-fee'
import { finalizeCompletedPiPayment } from '@/lib/payment/complete-payment'
import { getAdSettings } from '@/lib/ads/settings'
import { adPlanPrice } from '@/lib/ads/pricing'
import type { PiPaymentDto } from '@/lib/pi/pi-payment-dto'
import { canActAsPatient } from '@/lib/client/patient-access'

function txNotes(payload: Record<string, unknown>) {
  return JSON.stringify(payload)
}

function parseNotes(notes: string | null) {
  try {
    return JSON.parse(notes ?? '{}') as Record<string, unknown>
  } catch {
    return {}
  }
}

export async function processIncompletePiPayment(
  userId: string,
  role: Role,
  payment: PiPaymentDto,
): Promise<{ message: string }> {
  if (payment.status.cancelled || payment.status.user_cancelled) {
    return { message: 'الدفع ملغى' }
  }

  const paymentId = payment.identifier
  const purpose = payment.metadata.purpose as string | undefined

  let transaction = await prisma.transaction.findFirst({
    where: { userId, notes: { contains: paymentId } },
    orderBy: { createdAt: 'desc' },
  })

  if (!payment.status.developer_approved) {
    if (!transaction) {
      transaction = await createPendingTransaction(userId, role, payment)
    }
    await piPaymentService.approvePayment(paymentId)
    return { message: 'تمت موافقة الدفع المعلق' }
  }

  const txid = payment.transaction?.txid
  if (txid && !payment.status.developer_completed) {
    if (!transaction) {
      transaction = await createPendingTransaction(userId, role, payment)
      await piPaymentService.approvePayment(paymentId)
    }

    if (transaction.status === 'COMPLETED') {
      return { message: 'تم إتمام الدفع مسبقاً' }
    }

    await piPaymentService.completePayment(paymentId, txid)

    const result = await finalizeCompletedPiPayment({
      userId,
      transaction,
      txHash: txid,
      piPaymentId: paymentId,
    })
    return { message: result.message }
  }

  if (transaction?.status === 'COMPLETED') {
    return { message: 'الدفع مكتمل' }
  }

  return { message: purpose === 'PREMIO' ? 'لا يوجد دفع بريميو معلق للإكمال' : 'تمت معالجة الدفع المعلق' }
}

async function createPendingTransaction(userId: string, role: Role, payment: PiPaymentDto) {
  const paymentId = payment.identifier
  const purpose = payment.metadata.purpose as string | undefined
  const amount = payment.amount

  if (purpose === 'PREMIO') {
    if (role !== Role.DOCTOR && role !== Role.FACILITY) {
      throw new Error('غير مصرح')
    }
    const planType = payment.metadata.planType as PremioType | undefined
    if (!planType) throw new Error('نوع خطة البريميو مطلوب')

    const settings = await prisma.premioSettings.findFirst()
    if (!settings) throw new Error('لم يتم تعيين أسعار البريميو')

    const expected =
      planType === 'MONTHLY' ? Number(settings.monthlyPrice) :
      planType === 'YEARLY' ? Number(settings.yearlyPrice) :
      Number(settings.lifetimePrice)

    if (Math.abs(expected - amount) > 0.0001) {
      throw new Error('مبلغ الدفع لا يطابق سعر خطة البريميو')
    }

    const { platformFee, receiverAmount } = splitPremioPayment(amount)
    return prisma.transaction.create({
      data: {
        userId,
        type: 'PREMIO_PURCHASE',
        status: 'PENDING',
        amountTotal: amount,
        platformFee,
        receiverAmount,
        notes: txNotes({ piPaymentId: paymentId, purpose: 'PREMIO', planType }),
      },
    })
  }

  if (purpose === 'APPOINTMENT') {
    if (!canActAsPatient(role)) throw new Error('غير مصرح')
    const appointmentId = payment.metadata.appointmentId as string | undefined
    const paymentType = payment.metadata.paymentType as 'FULL' | 'DEPOSIT' | undefined
    if (!appointmentId || !paymentType) throw new Error('بيانات الموعد ناقصة')

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clientId: userId, deletedAt: null },
      include: { doctor: { select: { id: true, depositPercentage: true, consultationFee: true } } },
    })
    if (!appointment) throw new Error('الموعد غير موجود')
    if (appointment.isPaid) throw new Error('تم دفع هذا الموعد مسبقاً')
    if (paymentType === 'DEPOSIT' && appointment.isDepositPaid) {
      throw new Error('تم دفع العربون مسبقاً')
    }

    const fee = Number(appointment.fee ?? appointment.doctor?.consultationFee ?? 0)
    let transactionType: 'APPOINTMENT_FEE' | 'DEPOSIT' | 'FINAL_PAYMENT' = 'APPOINTMENT_FEE'
    let expected = fee

    if (paymentType === 'DEPOSIT' && appointment.doctor) {
      expected = fee * (Number(appointment.doctor.depositPercentage) / 100)
      transactionType = 'DEPOSIT'
    } else if (paymentType === 'FULL' && appointment.isDepositPaid) {
      expected = fee - Number(appointment.depositAmount ?? 0)
      transactionType = 'FINAL_PAYMENT'
    }

    if (Math.abs(expected - amount) > 0.0001) {
      throw new Error('مبلغ الدفع لا يطابق رسوم الموعد')
    }

    const { platformFee, receiverAmount } = splitDoctorPayment(amount)
    return prisma.transaction.create({
      data: {
        userId,
        doctorId: appointment.doctorId ?? undefined,
        appointmentId,
        type: transactionType,
        status: 'PENDING',
        amountTotal: amount,
        platformFee,
        receiverAmount,
        notes: txNotes({
          piPaymentId: paymentId,
          purpose: 'APPOINTMENT',
          appointmentId,
          paymentType,
          transactionType,
        }),
      },
    })
  }

  if (purpose === 'PAID_AD') {
    const adId = payment.metadata.adId as string | undefined
    const adPlan = payment.metadata.adPlan as AdPlan | undefined
    if (!adId || !adPlan) throw new Error('بيانات الإعلان ناقصة')

    const ad = await prisma.paidAdvertisement.findFirst({
      where: { id: adId, requesterUserId: userId, status: PaidAdStatus.PENDING_PAYMENT },
    })
    if (!ad) throw new Error('طلب الإعلان غير موجود')

    const settings = await getAdSettings()
    const expected = adPlanPrice(settings, adPlan)
    if (Math.abs(expected - amount) > 0.0001) {
      throw new Error('مبلغ الدفع لا يطابق سعر الإعلان')
    }

    const { platformFee, receiverAmount } = splitPremioPayment(amount)
    return prisma.transaction.create({
      data: {
        userId,
        type: 'PAID_AD',
        status: 'PENDING',
        amountTotal: amount,
        platformFee,
        receiverAmount,
        notes: txNotes({ piPaymentId: paymentId, purpose: 'PAID_AD', adId, adPlan }),
      },
    })
  }

  if (purpose === 'INSTANT_CONSULT') {
    if (!canActAsPatient(role)) throw new Error('غير مصرح')
    const instantConsultId = payment.metadata.instantConsultId as string | undefined
    if (!instantConsultId) throw new Error('معرف الاستشارة الفورية مطلوب')

    const profile = await prisma.clientProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!profile) throw new Error('ملف المريض غير موجود')

    const consult = await prisma.instantConsultRequest.findFirst({
      where: {
        id: instantConsultId,
        clientId: profile.id,
        status: InstantConsultStatus.AWAITING_PAYMENT,
      },
    })
    if (!consult) throw new Error('طلب الاستشارة غير موجود')

    const expected = Number(consult.fee) - Number(consult.creditApplied ?? 0)
    if (Math.abs(expected - amount) > 0.0001) {
      throw new Error('مبلغ الدفع لا يطابق رسوم الاستشارة')
    }

    const { platformFee, receiverAmount } = splitDoctorPayment(amount)
    return prisma.transaction.create({
      data: {
        userId,
        doctorId: consult.doctorId ?? undefined,
        type: 'INSTANT_CONSULT',
        status: 'PENDING',
        amountTotal: amount,
        platformFee,
        receiverAmount,
        notes: txNotes({
          piPaymentId: paymentId,
          purpose: 'INSTANT_CONSULT',
          instantConsultId,
          transactionType: 'INSTANT_CONSULT',
        }),
      },
    })
  }

  throw new Error('نوع الدفع غير معروف في metadata')
}
