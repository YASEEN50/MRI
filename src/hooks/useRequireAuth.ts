'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import type { Session } from 'next-auth'
import type { Role } from '@prisma/client'
import {
  isPiBrowser,
  markPiSessionRedirect,
  requestPiCookieAccess,
  shouldSkipPiAutoLogin,
} from '@/lib/pi/pi-auth-client'

type Options = {
  redirectTo?: string
  roles?: Role[]
  onRoleMismatch?: string
}

async function readAuthSession(): Promise<Session | null> {
  await requestPiCookieAccess()
  const res = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' })
  const data = (await res.json()) as Session | null
  return data?.user ? data : null
}

/** Pi iframe: fetch may see the session before useSession — retry before sending user to /login. */
async function resolvePiSession(
  update: () => Promise<Session | null>,
): Promise<Session | null> {
  await requestPiCookieAccess()

  for (let i = 0; i < 5; i++) {
    const refreshed = await update()
    if (refreshed?.user) return refreshed

    const fetched = await readAuthSession()
    if (fetched?.user) {
      await update()
      return fetched
    }

    await new Promise((r) => window.setTimeout(r, 350))
  }

  return null
}

/**
 * Wait for Pi cookie bootstrap + API session check, then redirect to login only if truly signed out.
 */
export function useRequireAuth(options: Options = {}) {
  const { redirectTo = '/login', roles, onRoleMismatch = '/' } = options
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [fallbackSession, setFallbackSession] = useState<Session | null>(null)
  const [checked, setChecked] = useState(false)

  const effectiveSession = session ?? fallbackSession

  useEffect(() => {
    if (status === 'loading') return

    let active = true

    ;(async () => {
      if (status === 'authenticated' && session?.user) {
        if (roles && !roles.includes(session.user.role)) {
          router.replace(onRoleMismatch)
          return
        }
        if (active) {
          setFallbackSession(null)
          setChecked(true)
        }
        return
      }

      if (isPiBrowser() && !shouldSkipPiAutoLogin()) {
        const resolved = await resolvePiSession(update)
        if (!active) return

        if (resolved?.user) {
          if (roles && !roles.includes(resolved.user.role)) {
            router.replace(onRoleMismatch)
            return
          }
          setFallbackSession(resolved)
          setChecked(true)
          return
        }
      }

      if (active && status === 'unauthenticated' && !fallbackSession?.user) {
        markPiSessionRedirect()
        router.replace(redirectTo)
        return
      }

      if (active) setChecked(true)
    })()

    return () => {
      active = false
    }
  }, [status, session, update, router, redirectTo, onRoleMismatch, roles])

  const isAuthenticated =
    (status === 'authenticated' || !!fallbackSession?.user) && checked

  return {
    session: effectiveSession,
    status,
    isLoading: status === 'loading' || !checked,
    isAuthenticated,
  }
}
