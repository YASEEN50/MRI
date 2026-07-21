'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { isPiBrowser, requestPiCookieAccess } from '@/lib/pi/pi-auth-client'

async function fetchSessionUser(): Promise<boolean> {
  await requestPiCookieAccess()
  const res = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' })
  const data = await res.json()
  return !!data?.user
}

/**
 * Pi Browser embeds the app in a cross-site iframe — session cookies may be
 * blocked until requestStorageAccess() runs. Bootstrap before pages redirect to /login.
 */
export function PiSessionGate({ children }: { children: React.ReactNode }) {
  const { status, update } = useSession()
  const [bootstrapped, setBootstrapped] = useState(() =>
    typeof window === 'undefined' ? true : !isPiBrowser(),
  )

  useEffect(() => {
    if (bootstrapped || !isPiBrowser()) return

    let active = true

    ;(async () => {
      if (status === 'authenticated') {
        if (active) setBootstrapped(true)
        return
      }

      for (let attempt = 0; attempt < 6; attempt++) {
        await requestPiCookieAccess()

        try {
          const refreshed = await Promise.race([
            update(),
            new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 1200)),
          ])
          if (refreshed?.user) break
        } catch {
          /* optional */
        }

        if (await fetchSessionUser()) break

        await new Promise((r) => window.setTimeout(r, 400))
      }

      if (active) setBootstrapped(true)
    })()

    return () => {
      active = false
    }
  }, [bootstrapped, status, update])

  const waiting = !bootstrapped || (status === 'loading' && isPiBrowser())

  if (waiting) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        <p className="text-slate-400 text-sm">جاري تحميل الجلسة...</p>
      </div>
    )
  }

  return <>{children}</>
}
