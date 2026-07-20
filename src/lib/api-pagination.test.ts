import { describe, it, expect } from 'vitest'
import { parsePagination } from '@/lib/api-pagination'

describe('parsePagination', () => {
  it('uses defaults when params missing', () => {
    const params = new URLSearchParams()
    expect(parsePagination(params)).toEqual({ page: 1, limit: 20, skip: 0 })
  })

  it('clamps limit to maxLimit', () => {
    const params = new URLSearchParams({ limit: '9999' })
    expect(parsePagination(params, { maxLimit: 50 }).limit).toBe(50)
  })

  it('rejects invalid page and limit', () => {
    const params = new URLSearchParams({ page: '-1', limit: '0' })
    expect(parsePagination(params)).toEqual({ page: 1, limit: 20, skip: 0 })
  })

  it('computes skip from page', () => {
    const params = new URLSearchParams({ page: '3', limit: '10' })
    expect(parsePagination(params)).toEqual({ page: 3, limit: 10, skip: 20 })
  })
})
