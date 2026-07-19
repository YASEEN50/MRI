import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAdminPermission, ADMIN_PERMISSION_KEYS } from '@/lib/admin/permissions'
import { ok, fromAppError, serverError, fromZodError } from '@/lib/api-response'
import {
  completePatientRefundByAdmin,
  listPendingPatientRefunds,
} from '@/lib/payment/instant-consult-escrow'

const CompleteSchema = z.object({
  transactionId: z.string().uuid(),
  txHash: z.string().min(8).max(128),
})

export async function GET() {
  try {
    const auth = await requireAdminPermission(ADMIN_PERMISSION_KEYS.canManageWithdrawals)
    if (!auth.success) return fromAppError(auth.error)

    const rows = await listPendingPatientRefunds()
    return ok(rows)
  } catch (err) {
    console.error('[GET /api/admin/patient-refunds]', err)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminPermission(ADMIN_PERMISSION_KEYS.canManageWithdrawals)
    if (!auth.success) return fromAppError(auth.error)

    const body = await req.json()
    const parsed = CompleteSchema.safeParse(body)
    if (!parsed.success) return fromZodError(parsed.error)

    const result = await completePatientRefundByAdmin(
      parsed.data.transactionId,
      parsed.data.txHash,
    )
    if (!result.ok) return ok({ error: true, message: result.message })

    return ok({ completed: true })
  } catch (err) {
    console.error('[POST /api/admin/patient-refunds]', err)
    return serverError()
  }
}
