import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/request-ip'
import { rateLimitAuth, rateLimitResponse } from '@/lib/upstash-rate-limit'

/** Returns 429 response when limit exceeded, otherwise null. */
export async function enforceAuthRateLimit(
  req: NextRequest,
  endpoint: string,
): Promise<NextResponse | null> {
  const rl = await rateLimitAuth(getClientIp(req), endpoint)
  if (rl.success) return null
  return NextResponse.json(rateLimitResponse(rl), {
    status: 429,
    headers: { 'Retry-After': String(rl.resetIn) },
  })
}
