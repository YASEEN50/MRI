import { NextResponse } from 'next/server'
import { isCrossSiteAuthCookieMode } from '@/lib/auth/cookie-options'

const SESSION_COOKIE_NAMES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  '__Host-next-auth.session-token',
]

type ClearVariant = {
  secure: boolean
  sameSite: 'Lax' | 'None'
  partitioned: boolean
}

function buildClearCookie(name: string, variant: ClearVariant): string {
  const parts = [
    `${name}=`,
    'Path=/',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'HttpOnly',
  ]
  if (variant.secure) parts.push('Secure')
  parts.push(`SameSite=${variant.sameSite}`)
  if (variant.partitioned) parts.push('Partitioned')
  return parts.join('; ')
}

/** Append Set-Cookie clears for every known session cookie variant (Pi iframe safe). */
export function appendSessionCookieClears(res: NextResponse): NextResponse {
  const crossSite = isCrossSiteAuthCookieMode()
  const variants: ClearVariant[] = crossSite
    ? [
        { secure: true, sameSite: 'None', partitioned: false },
        { secure: true, sameSite: 'None', partitioned: true },
        { secure: true, sameSite: 'Lax', partitioned: false },
      ]
    : [{ secure: false, sameSite: 'Lax', partitioned: false }]

  for (const name of SESSION_COOKIE_NAMES) {
    for (const variant of variants) {
      res.headers.append('Set-Cookie', buildClearCookie(name, variant))
    }
  }
  return res
}
