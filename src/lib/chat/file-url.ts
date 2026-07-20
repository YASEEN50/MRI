/** Allowed chat attachment URLs — must come from platform upload flow. */
export function isAllowedChatFileUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed || trimmed.length > 2048) return false

  if (trimmed.startsWith('/api/files/chat/')) {
    return /^\/api\/files\/chat\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|pdf)$/i.test(trimmed.split('?')[0])
  }

  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    try {
      const parsed = new URL(trimmed)
      const path = decodeURIComponent(parsed.pathname)
      return /\/chat\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|pdf)$/i.test(path)
    } catch {
      return false
    }
  }

  return /^chat\/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|pdf)$/i.test(trimmed)
}
