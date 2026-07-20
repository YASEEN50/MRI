'use client'

import { signOut } from 'next-auth/react'
import { isPiBrowser, markExplicitLogout, requestPiCookieAccess } from '@/lib/pi/pi-auth-client'

/** POST signout then redirect to guest landing. Pi Browser uses pi-logout (no CSRF). */
export async function performLogout(redirectTo?: string): Promise<void> {
  markExplicitLogout()
  const target = redirectTo ?? '/pi.html?logged_out=1'

  if (typeof window !== 'undefined' && isPiBrowser()) {
    await requestPiCookieAccess()
    try {
      const res = await fetch('/api/auth/pi-logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      })
      const data = await res.json()
      const inner = data?.data as { redirect?: string } | undefined
      window.location.replace(inner?.redirect ?? target)
      return
    } catch {
      window.location.replace(target)
      return
    }
  }

  await signOut({ callbackUrl: target, redirect: true })
}
