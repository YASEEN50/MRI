export type AppointmentPaymentPolicy =
  | 'PAY_BEFORE_BOOKING'
  | 'DEPOSIT_AND_PAY_LATER'
  | 'PAY_ON_SERVICE'

export interface AppointmentPaymentInput {
  fee: number
  paymentPolicy: AppointmentPaymentPolicy
  depositPercentage?: number
  isDepositPaid?: boolean
  depositAmount?: number | null
  isPaid?: boolean
  /** When true, PAY_ON_SERVICE allows collecting full fee (after appointment completed). */
  serviceCompleted?: boolean
}

export function resolveAppointmentPayment(input: AppointmentPaymentInput): {
  paymentType: 'FULL' | 'DEPOSIT'
  amount: number
  requiresPayment: boolean
} {
  const {
    fee,
    paymentPolicy,
    depositPercentage = 30,
    isDepositPaid = false,
    depositAmount,
    isPaid = false,
    serviceCompleted = false,
  } = input

  if (isPaid || fee <= 0) {
    return { paymentType: 'FULL', amount: 0, requiresPayment: false }
  }

  if (paymentPolicy === 'PAY_ON_SERVICE') {
    if (!serviceCompleted) {
      return { paymentType: 'FULL', amount: fee, requiresPayment: false }
    }
    return { paymentType: 'FULL', amount: fee, requiresPayment: true }
  }

  if (paymentPolicy === 'DEPOSIT_AND_PAY_LATER') {
    if (!isDepositPaid) {
      return {
        paymentType: 'DEPOSIT',
        amount: fee * (depositPercentage / 100),
        requiresPayment: true,
      }
    }
    const paidDeposit = depositAmount ?? fee * (depositPercentage / 100)
    return {
      paymentType: 'FULL',
      amount: Math.max(fee - paidDeposit, 0),
      requiresPayment: true,
    }
  }

  return { paymentType: 'FULL', amount: fee, requiresPayment: true }
}
