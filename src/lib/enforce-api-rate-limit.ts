import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/request-ip'
import {
  rateLimitChat,
  rateLimitPayment,
  rateLimitSearch,
  rateLimitResponse,
} from '@/lib/upstash-rate-limit'

export async function enforceSearchRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const rl = await rateLimitSearch(getClientIp(req))
  if (rl.success) return null
  return NextResponse.json(rateLimitResponse(rl), {
    status: 429,
    headers: { 'Retry-After': String(rl.resetIn) },
  })
}

export async function enforceChatRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const rl = await rateLimitChat(getClientIp(req))
  if (rl.success) return null
  return NextResponse.json(rateLimitResponse(rl), {
    status: 429,
    headers: { 'Retry-After': String(rl.resetIn) },
  })
}

export async function enforcePaymentRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const rl = await rateLimitPayment(getClientIp(req))
  if (rl.success) return null
  return NextResponse.json(rateLimitResponse(rl), {
    status: 429,
    headers: { 'Retry-After': String(rl.resetIn) },
  })
}
