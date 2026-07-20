import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { appendSessionCookieClears } from '@/lib/auth/clear-session-cookies'
import { sessionCookieName, sessionCookieOptions } from '@/lib/auth/cookie-options'
import { ok, serverError } from '@/lib/api-response'

const LEGACY_COOKIE_NAMES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  '__Host-next-auth.session-token',
]

/** Clear NextAuth session cookie — Pi Browser iframe (no CSRF dependency). */
export async function POST() {
  try {
    const cookieStore = await cookies()
    const cleared = new Set<string>()

    for (const name of [sessionCookieName(), ...LEGACY_COOKIE_NAMES]) {
      if (cleared.has(name)) continue
      cleared.add(name)
      cookieStore.set(name, '', {
        ...sessionCookieOptions(0),
        maxAge: 0,
        expires: new Date(0),
      })
    }

    const res = ok({ redirect: '/pi.html?logged_out=1' }) as NextResponse
    return appendSessionCookieClears(res)
  } catch (err) {
    console.error('[POST /api/auth/pi-logout]', err)
    return serverError()
  }
}
