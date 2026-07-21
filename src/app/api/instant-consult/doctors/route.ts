import { NextRequest, NextResponse } from 'next/server'
import { ok, fromAppError, serverError } from '@/lib/api-response'
import { requireAuth } from '@/infrastructure/auth/providers/role-guard'
import { listAvailableInstantDoctors } from '@/lib/instant-consult/service'
import { getClientIp } from '@/lib/request-ip'
import { rateLimitInstantConsultDoctors, rateLimitResponse } from '@/lib/upstash-rate-limit'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.success) return fromAppError(auth.error)

    const ip = getClientIp(req)
    const rl = await rateLimitInstantConsultDoctors(ip)
    if (!rl.success) {
      return NextResponse.json(rateLimitResponse(rl), {
        status: 429,
        headers: { 'Retry-After': String(rl.resetIn) },
      })
    }

    const specialization = req.nextUrl.searchParams.get('specialization')
    const doctors = await listAvailableInstantDoctors(specialization)
    return ok(doctors)
  } catch (err) {
    console.error('[GET /api/instant-consult/doctors]', err)
    return serverError()
  }
}
