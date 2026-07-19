import { isPiSandboxMode, isPiPaymentsConfigured } from '@/lib/pi/pi-api-key'
import { piPaymentService } from '@/infrastructure/pi-network/pi-payment.service'

export type A2UPayoutResult =
  | { ok: true; mode: 'completed'; piPaymentId: string; txHash: string; toAddress?: string }
  | { ok: true; mode: 'pending'; piPaymentId: string; toAddress?: string }
  | { ok: false; message: string }

function roundPi(n: number): number {
  return Math.round(n * 10000) / 10000
}

/** Send π from app wallet to a Pi user (A2U). Auto-completes in sandbox/dev simulation. */
export async function sendA2UPayout(input: {
  uid: string
  amount: number
  memo: string
  metadata?: Record<string, unknown>
}): Promise<A2UPayoutResult> {
  const amount = roundPi(input.amount)
  if (amount < 0.0001) {
    return { ok: false, message: 'مبلغ A2U غير صالح' }
  }

  try {
    const payment = await piPaymentService.createA2UPayment({
      uid: input.uid,
      amount,
      memo: input.memo,
      metadata: input.metadata,
    })

    const shouldAutoComplete =
      isPiSandboxMode() ||
      (process.env.NODE_ENV !== 'production' && !isPiPaymentsConfigured())

    if (shouldAutoComplete) {
      const txHash = `SIM_A2U_REFUND_${payment.paymentId}`
      await piPaymentService.completePayment(payment.paymentId, txHash)
      return {
        ok: true,
        mode: 'completed',
        piPaymentId: payment.paymentId,
        txHash,
        toAddress: payment.toAddress,
      }
    }

    return {
      ok: true,
      mode: 'pending',
      piPaymentId: payment.paymentId,
      toAddress: payment.toAddress,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'فشل A2U'
    console.error('[sendA2UPayout]', message)
    return { ok: false, message }
  }
}

/** Complete a pending A2U payout after manual blockchain send (production). */
export async function completeA2UPayout(
  piPaymentId: string,
  txHash: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const hash = txHash.trim()
  if (!hash) return { ok: false, message: 'txid مطلوب' }

  try {
    await piPaymentService.completePayment(piPaymentId, hash)
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'فشل إتمام A2U'
    return { ok: false, message }
  }
}
