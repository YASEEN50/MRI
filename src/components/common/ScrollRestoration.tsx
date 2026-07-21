'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  readScrollPosition,
  restoreScrollPosition,
  saveScrollPosition,
  scrollStorageKey,
} from '@/lib/navigation/scroll-restoration'

/**
 * Saves scroll position per route and restores it on browser / in-app back navigation.
 * Forward navigations (Link, router.push) still start at the top.
 */
export default function ScrollRestoration() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const routeKey = scrollStorageKey(pathname, search)

  const popStateRef = useRef(false)
  const activeKeyRef = useRef(routeKey)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const onPopState = () => {
      popStateRef.current = true
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    activeKeyRef.current = routeKey

    const saved = popStateRef.current ? readScrollPosition(routeKey) : null
    if (saved != null) {
      restoreScrollPosition(saved)
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    }

    popStateRef.current = false

    let raf = 0
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        saveScrollPosition(activeKeyRef.current, window.scrollY)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
      saveScrollPosition(routeKey, window.scrollY)
    }
  }, [routeKey])

  return null
}
