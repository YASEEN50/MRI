const SCROLL_PREFIX = 'scroll-pos:'
const SCROLL_RESTORE_NEXT_KEY = 'scroll-restore-next'

export function scrollStorageKey(pathname: string, search: string): string {
  return `${SCROLL_PREFIX}${pathname}${search ? `?${search}` : ''}`
}

/** Mark destination route to restore scroll after router.push back navigation. */
export function markScrollRestoreOnNextNav(pathname: string, search: string): void {
  try {
    sessionStorage.setItem(SCROLL_RESTORE_NEXT_KEY, scrollStorageKey(pathname, search))
  } catch {
    /* ignore */
  }
}

export function consumeScrollRestoreTarget(): string | null {
  try {
    const key = sessionStorage.getItem(SCROLL_RESTORE_NEXT_KEY)
    sessionStorage.removeItem(SCROLL_RESTORE_NEXT_KEY)
    return key
  } catch {
    return null
  }
}

export function saveScrollPosition(key: string, y: number): void {
  try {
    sessionStorage.setItem(key, String(Math.max(0, Math.round(y))))
  } catch {
    /* ignore quota / private mode */
  }
}

export function readScrollPosition(key: string): number | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (raw == null) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

/** Retry scroll restore while async content expands the page. */
export function restoreScrollPosition(y: number): void {
  const apply = () => window.scrollTo({ top: y, left: 0, behavior: 'instant' as ScrollBehavior })
  apply()
  requestAnimationFrame(apply)
  for (const delay of [50, 150, 400, 800, 1200]) {
    window.setTimeout(apply, delay)
  }
}
