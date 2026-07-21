import { NextResponse } from 'next/server'
import { isCrossSiteAuthCookieMode } from '@/lib/auth/cookie-options'

const SESSION_COOKIE_NAMES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  '__Host-next-auth.session-token',
]

export const PI_GUEST_COOKIE = 'pi_guest'

type ClearVariant = {
  secure: boolean
  sameSite: 'Lax' | 'None'
  partitioned: boolean
}

function buildCookie(
  name: string,
  value: string,
  maxAge: number,
  variant: ClearVariant,
  httpOnly = false,
): string {
  const parts = [`${name}=${value}`, 'Path=/', `Max-Age=${maxAge}`]
  if (maxAge === 0) parts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT')
  if (httpOnly) parts.push('HttpOnly')
  if (variant.secure) parts.push('Secure')
  parts.push(`SameSite=${variant.sameSite}`)
  if (variant.partitioned) parts.push('Partitioned')
  return parts.join('; ')
}

function guestCookieVariants(): ClearVariant[] {
  const crossSite = isCrossSiteAuthCookieMode()
  return crossSite
    ? [
        { secure: true, sameSite: 'None', partitioned: false },
        { secure: true, sameSite: 'None', partitioned: true },
      ]
    : [{ secure: false, sameSite: 'Lax', partitioned: false }]
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
      res.headers.append('Set-Cookie', buildCookie(name, '', 0, variant, true))
    }
  }
  return res
}

/** Mark explicit Pi guest mode (survives app close — blocks auto-login until sign-in). */
export function appendGuestModeCookie(res: NextResponse): NextResponse {
  const oneYear = 60 * 60 * 24 * 365
  for (const variant of guestCookieVariants()) {
    res.headers.append('Set-Cookie', buildCookie(PI_GUEST_COOKIE, '1', oneYear, variant, false))
  }
  return res
}

/** Clear guest mode after successful sign-in. */
export function appendClearGuestModeCookie(res: NextResponse): NextResponse {
  for (const variant of guestCookieVariants()) {
    res.headers.append('Set-Cookie', buildCookie(PI_GUEST_COOKIE, '', 0, variant, false))
  }
  return res
}
