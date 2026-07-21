const SCROLL_PREFIX = 'scroll-pos:'

export function scrollStorageKey(pathname: string, search: string): string {
  return `${SCROLL_PREFIX}${pathname}${search ? `?${search}` : ''}`
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
