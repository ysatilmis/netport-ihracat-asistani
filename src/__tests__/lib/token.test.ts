import { describe, it, expect } from 'vitest'
import { isOverLimit, calculateRemainingReports } from '@/lib/token'

describe('isOverLimit', () => {
  it('returns false when usage is below limit', () => {
    expect(isOverLimit(2, 3)).toBe(false)
  })

  it('returns true when usage equals limit', () => {
    expect(isOverLimit(3, 3)).toBe(true)
  })

  it('returns true when usage exceeds limit', () => {
    expect(isOverLimit(4, 3)).toBe(true)
  })

  it('returns false for unlimited tier (-1 limit)', () => {
    expect(isOverLimit(9999, -1)).toBe(false)
  })
})

describe('calculateRemainingReports', () => {
  it('returns positive remaining reports', () => {
    expect(calculateRemainingReports(1, 3)).toBe(2)
  })

  it('returns 0 when at limit', () => {
    expect(calculateRemainingReports(3, 3)).toBe(0)
  })

  it('returns 0 when over limit (never negative)', () => {
    expect(calculateRemainingReports(5, 3)).toBe(0)
  })

  it('returns Infinity for unlimited tier (-1 limit)', () => {
    expect(calculateRemainingReports(10, -1)).toBe(Number.POSITIVE_INFINITY)
  })
})
