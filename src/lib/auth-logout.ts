'use client'

import { markExplicitLogout } from '@/lib/pi/pi-auth-client'

/** POST pi-logout (clears Pi iframe cookies) then redirect to guest landing. */
export async function performLogout(redirectTo?: string): Promise<void> {
  markExplicitLogout()
  const target = redirectTo ?? '/pi.html?logged_out=1'
  const url = target.includes('logged_out')
    ? target
    : `${target}${target.includes('?') ? '&' : '?'}logged_out=1`

  // Always land on static Pi guest page after logout (not Next.js `/`).
  const landing = url.includes('pi.html') ? url : '/pi.html?logged_out=1'

  try {
    const res = await fetch('/api/auth/pi-logout', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    })
    const data = await res.json()
    const inner = data?.data ?? data
    window.location.replace(inner?.redirect ?? landing)
  } catch {
    window.location.replace(landing)
  }
}
