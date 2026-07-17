import { NextRequest } from 'next/server'
import { emailAuthDisabledResponse } from '@/lib/auth/pi-only-auth'

export async function POST(_req: NextRequest) {
  return emailAuthDisabledResponse()
}
