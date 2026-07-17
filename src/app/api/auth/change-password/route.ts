// src/app/api/auth/change-password/route.ts — Email auth disabled (Pi-only)
import { emailAuthDisabledResponse } from '@/lib/auth/pi-only-auth'

export async function POST() {
  return emailAuthDisabledResponse()
}
