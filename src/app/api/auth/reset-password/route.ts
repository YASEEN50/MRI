import { NextRequest } from 'next/server'
import { emailAuthDisabledOk } from '@/lib/auth/pi-only-auth'

export async function POST(_req: NextRequest) {
  return emailAuthDisabledOk()
}
