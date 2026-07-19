import { NextRequest } from 'next/server'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { requireAuth } from '@/infrastructure/auth/providers/role-guard'
import { ok, fromAppError, serverError } from '@/lib/api-response'
import { revokeVerificationForUser } from '@/lib/owner/account-enforcement'

const Schema = z.object({
  reason: z.string().min(3).max(500),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth({ roles: [Role.OWNER] })
    if (!auth.success) return fromAppError(auth.error)

    const { id } = await params
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) return ok({ error: true, message: 'سبب إلغاء التوثيق مطلوب' })

    const result = await revokeVerificationForUser(id, auth.context.userId, parsed.data.reason)
    if (!result.ok) return ok({ error: true, message: result.message })

    return ok({ message: 'تم إلغاء التوثيق' })
  } catch (err) {
    console.error('[POST /api/owner/users/[id]/revoke-verification]', err)
    return serverError()
  }
}
