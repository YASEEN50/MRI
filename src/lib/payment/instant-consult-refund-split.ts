export interface InstantConsultRefundSplitInput {
  fee: number
  creditApplied: number
  /** Pi U2A transaction total when paid from wallet (may be less than fee if credit was used). */
  piTransactionTotal?: number | null
  paidWithCreditOnly?: boolean
}

export interface InstantConsultRefundSplit {
  creditRefund: number
  walletRefund: number
}

/** Split instant consult refund: platform credit vs Pi wallet (A2U). */
export function splitInstantConsultRefund(
  input: InstantConsultRefundSplitInput,
): InstantConsultRefundSplit {
  const fee = Math.max(0, input.fee)
  const creditApplied = Math.max(0, input.creditApplied)

  if (input.paidWithCreditOnly) {
    return { creditRefund: fee, walletRefund: 0 }
  }

  const piPaid =
    input.piTransactionTotal != null && input.piTransactionTotal > 0
      ? Number(input.piTransactionTotal)
      : Math.max(0, fee - creditApplied)

  return {
    creditRefund: creditApplied,
    walletRefund: Math.max(0, piPaid),
  }
}

export function buildInstantConsultRefundMessage(
  split: InstantConsultRefundSplit,
  walletMode: 'completed' | 'pending' | 'skipped',
): string {
  const parts: string[] = []

  if (split.walletRefund > 0.0001 && walletMode === 'completed') {
    parts.push(`أُرجِع ${split.walletRefund.toFixed(4)} π إلى محفظة Pi`)
  } else if (split.walletRefund > 0.0001 && walletMode === 'pending') {
    parts.push(
      `جاري تحويل ${split.walletRefund.toFixed(4)} π إلى محفظة Pi — سيصل خلال دقائق`,
    )
  }

  if (split.creditRefund > 0.0001) {
    parts.push(`أُضيف ${split.creditRefund.toFixed(4)} π إلى رصيدك في المنصة`)
  }

  if (parts.length === 0) {
    return 'تم استرداد المبلغ'
  }

  return parts.join(' — ')
}
