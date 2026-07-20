import { NextRequest } from 'next/server'
import { Role } from '@prisma/client'
import { z } from 'zod'
import { requireOwnerAuth } from '@/infrastructure/auth/providers/role-guard'
import { ok, fromAppError, serverError } from '@/lib/api-response'
import { unsuspendUserAccount } from '@/lib/owner/account-enforcement'

const Schema = z.object({
  notes: z.string().max(500).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireOwnerAuth()
    if (!auth.success) return fromAppError(auth.error)

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const parsed = Schema.safeParse(body)

    const result = await unsuspendUserAccount(
      id,
      auth.context.userId,
      parsed.success ? parsed.data.notes : undefined,
    )
    if (!result.ok) return ok({ error: true, message: result.message })

    return ok({ message: 'تم إلغاء تجميد الحساب' })
  } catch (err) {
    console.error('[POST /api/owner/users/[id]/unsuspend]', err)
    return serverError()
  }
}
