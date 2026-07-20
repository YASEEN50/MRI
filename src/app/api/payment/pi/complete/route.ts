// src/app/api/payment/pi/complete/route.ts
import { NextRequest } from 'next/server'
import { requireAuth } from '@/infrastructure/auth/providers/role-guard'
import { ok, fromAppError, serverError } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { piPaymentService } from '@/infrastructure/pi-network/pi-payment.service'
import { finalizeCompletedPiPayment } from '@/lib/payment/complete-payment'
import { getPiNetworkApiKey, PI_PAYMENTS_NOT_CONFIGURED_MSG } from '@/lib/pi/pi-api-key'

import { z } from 'zod'

const CompleteSchema = z.object({
  paymentId: z.string().min(1),
  txid:        z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    if (!getPiNetworkApiKey()) {
      return ok({ error: true, message: PI_PAYMENTS_NOT_CONFIGURED_MSG })
    }

    const auth = await requireAuth()
    if (!auth.success) return fromAppError(auth.error)

    const body = await req.json()
    const parsed = CompleteSchema.safeParse(body)
    if (!parsed.success) return ok({ error: true, message: 'بيانات غير صحيحة' })

    const { paymentId, txid } = parsed.data

    const transaction = await prisma.transaction.findFirst({
      where: {
        userId: auth.context.userId,
        notes:  { contains: paymentId },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!transaction) {
      return ok({ error: true, message: 'لم يُعثر على عملية الدفع. أعد المحاولة.' })
    }

    if (transaction.status === 'COMPLETED') {
      return ok({ message: 'تم إتمام الدفع مسبقاً', transactionId: transaction.id })
    }

    await piPaymentService.completePayment(paymentId, txid)

    const result = await finalizeCompletedPiPayment({
      userId: auth.context.userId,
      transaction,
      txHash: txid,
      piPaymentId: paymentId,
    })

    return ok({ message: result.message, transactionId: transaction.id, ...result.extra })
  } catch (err) {
    console.error('[POST /api/payment/pi/complete]', err)
    return ok({ error: true, message: 'فشل إتمام الدفع عبر Pi Network' })
  }
}
