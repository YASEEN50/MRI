import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { JWT } from 'next-auth/jwt'

/** Edge-safe — mirrors cookie-options.ts without Node imports. */
export function isSecureAuthCookieMode(): boolean {
  if (process.env.NEXTAUTH_CROSS_SITE === 'true') return true
  if (process.env.NODE_ENV === 'production') return true
  const url = process.env.NEXTAUTH_URL ?? ''
  return url.startsWith('https://')
}

export function authSessionCookieName(): string {
  return isSecureAuthCookieMode()
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token'
}

/** Read NextAuth JWT in Edge middleware (explicit cookie name for Pi / cross-site). */
export async function readMiddlewareAuthToken(req: NextRequest): Promise<JWT | null> {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return null
  return getToken({
    req,
    secret,
    cookieName: authSessionCookieName(),
    secureCookie: isSecureAuthCookieMode(),
  })
}
