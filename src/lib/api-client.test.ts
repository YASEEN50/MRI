import { describe, expect, it } from 'vitest'
import { getApiError, isApiSuccess } from '@/lib/api-client'

describe('api-client', () => {
  it('reads modern error shape', () => {
    expect(getApiError({ success: false, error: { message: 'غير مصرح' } })).toBe('غير مصرح')
  })

  it('reads legacy error shape', () => {
    expect(getApiError({ success: true, data: { error: true, message: 'قديم' } })).toBe('قديم')
  })

  it('detects success', () => {
    expect(isApiSuccess({ success: true, data: { id: '1' } })).toBe(true)
    expect(isApiSuccess({ success: false, error: { message: 'x' } })).toBe(false)
    expect(isApiSuccess({ success: true, data: { error: true } })).toBe(false)
  })
})
