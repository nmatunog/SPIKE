import { describe, expect, it } from 'vitest'
import { formatCurrency } from './currency.js'

describe('formatCurrency', () => {
  it('formats PHP for en-PH locale', () => {
    const formatted = formatCurrency(25000, {
      code: 'PHP',
      locale: 'en-PH',
      maximumFractionDigits: 0,
    })
    expect(formatted).toMatch(/25,000|25000/)
    expect(formatted).toMatch(/₱|PHP/)
  })
})
