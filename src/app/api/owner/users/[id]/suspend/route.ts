import { NextRequest } from 'next/server'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { requireOwnerAuth } from '@/infrastructure/auth/providers/role-guard'
import { ok, fromAppError, serverError } from '@/lib/api-response'
import { suspendUserAccount } from '@/lib/owner/account-enforcement'

const Schema = z.object({
  reason: z.string().min(3).max(500),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireOwnerAuth()
    if (!auth.success) return fromAppError(auth.error)

    const { id } = await params
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) return ok({ error: true, message: 'سبب التجميد مطلوب (3 أحرف على الأقل)' })

    const result = await suspendUserAccount(id, auth.context.userId, parsed.data.reason)
    if (!result.ok) return ok({ error: true, message: result.message })

    const { enforcement } = result
    const parts = ['تم تجميد الحساب']
    if (enforcement.cancelledAppointments > 0) {
      parts.push(`أُلغي ${enforcement.cancelledAppointments} موعد`)
    }
    if (enforcement.refundedAppointments > 0) {
      parts.push(`استُرد ${enforcement.refundedAppointments} دفعة موعد`)
    }
    if (enforcement.cancelledConsults > 0) {
      parts.push(`أُلغي ${enforcement.cancelledConsults} استشارة فورية`)
    }
    if (enforcement.refundedConsults > 0) {
      parts.push(`استُرد ${enforcement.refundedConsults} دفعة استشارة`)
    }

    return ok({ message: parts.join(' — '), enforcement })
  } catch (err) {
    console.error('[POST /api/owner/users/[id]/suspend]', err)
    return serverError()
  }
}
