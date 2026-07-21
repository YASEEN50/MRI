/** Read API error message from modern or legacy response shapes. */
export function getApiError(json: unknown): string | null {
  if (!json || typeof json !== 'object') return null
  const body = json as {
    success?: boolean
    error?: { message?: string; code?: string }
    data?: { error?: boolean; message?: string; code?: string }
    message?: string
  }

  if (body.error?.message) return body.error.message
  if (body.data?.error) return body.data.message ?? 'حدث خطأ'
  if (body.success === false) return body.error?.message ?? body.message ?? 'حدث خطأ'
  return null
}

export function isApiSuccess(json: unknown): boolean {
  if (!json || typeof json !== 'object') return false
  const body = json as { success?: boolean; data?: { error?: boolean } }
  if (body.success === false) return false
  if (body.data?.error) return false
  return body.success === true
}
