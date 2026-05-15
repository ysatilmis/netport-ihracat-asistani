import { describe, it, expect } from 'vitest'
import { isOverLimit, calculateRemainingTokens } from '@/lib/token'

describe('isOverLimit', () => {
  it('returns false when usage is below limit', () => {
    expect(isOverLimit(3000, 5000)).toBe(false)
  })

  it('returns true when usage equals limit', () => {
    expect(isOverLimit(5000, 5000)).toBe(true)
  })

  it('returns true when usage exceeds limit', () => {
    expect(isOverLimit(5500, 5000)).toBe(true)
  })
})

describe('calculateRemainingTokens', () => {
  it('returns positive remaining tokens', () => {
    expect(calculateRemainingTokens(3000, 5000)).toBe(2000)
  })

  it('returns 0 when at limit', () => {
    expect(calculateRemainingTokens(5000, 5000)).toBe(0)
  })

  it('returns 0 when over limit (never negative)', () => {
    expect(calculateRemainingTokens(6000, 5000)).toBe(0)
  })
})
