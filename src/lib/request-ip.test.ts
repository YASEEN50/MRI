import { describe, it, expect } from 'vitest'
import { getClientIp } from '@/lib/request-ip'

describe('getClientIp', () => {
  it('reads first x-forwarded-for hop', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
    })
    expect(getClientIp(req)).toBe('203.0.113.1')
  })

  it('falls back to x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '198.51.100.2' },
    })
    expect(getClientIp(req)).toBe('198.51.100.2')
  })

  it('returns unknown when no proxy headers', () => {
    expect(getClientIp(new Request('http://localhost'))).toBe('unknown')
  })
})
