import { describe, expect, it } from 'vitest'
import { resolveBackHref } from '@/lib/navigation/breadcrumbs'

describe('resolveBackHref', () => {
  it('returns home from role dashboard landing pages', () => {
    expect(resolveBackHref('/owner', 'OWNER')).toBe('/')
    expect(resolveBackHref('/dashboard/doctor/schedule', 'DOCTOR')).toBe('/')
    expect(resolveBackHref('/dashboard/client/appointments', 'CLIENT')).toBe('/')
    expect(resolveBackHref('/dashboard/facility/overview', 'FACILITY')).toBe('/')
    expect(resolveBackHref('/dashboard/admin/verification', 'ADMIN')).toBe('/')
  })

  it('returns parent dashboard page for nested routes', () => {
    expect(resolveBackHref('/owner/ads', 'OWNER')).toBe('/owner')
    expect(resolveBackHref('/dashboard/doctor/instant-consult', 'DOCTOR')).toBe(
      '/dashboard/doctor/schedule',
    )
    expect(resolveBackHref('/dashboard/client/medical-records', 'CLIENT')).toBe(
      '/dashboard/client/appointments',
    )
  })

  it('returns home from public list pages', () => {
    expect(resolveBackHref('/doctors')).toBe('/')
    expect(resolveBackHref('/publications')).toBe('/')
    expect(resolveBackHref('/consult-now')).toBe('/')
  })

  it('hides back on root and auth entry pages', () => {
    expect(resolveBackHref('/')).toBeNull()
    expect(resolveBackHref('/login')).toBeNull()
    expect(resolveBackHref('/select-role')).toBeNull()
  })

  it('supports support tickets for all roles', () => {
    expect(resolveBackHref('/dashboard/support', 'DOCTOR')).toBe('/')
    expect(resolveBackHref('/dashboard/support/ticket-id', 'CLIENT')).toBe('/dashboard/support')
  })
})
