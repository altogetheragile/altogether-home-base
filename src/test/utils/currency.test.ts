
import { describe, it, expect } from 'vitest'
import { formatPrice } from '@/utils/currency'

describe('formatPrice', () => {
  it('should format USD currency correctly', () => {
    expect(formatPrice(10000, 'usd')).toBe('$100.00')
    expect(formatPrice(0, 'usd')).toBe('Free')
    expect(formatPrice(1, 'usd')).toBe('$0.01')
  })

  it('should handle different currencies', () => {
    expect(formatPrice(10000, 'eur')).toBe('€100.00')
    expect(formatPrice(10000, 'gbp')).toBe('£100.00')
  })

  it('should handle edge cases', () => {
    expect(formatPrice(undefined as any, 'usd')).toBe('Free')
    expect(formatPrice(null as any, 'usd')).toBe('Free')
  })
})
