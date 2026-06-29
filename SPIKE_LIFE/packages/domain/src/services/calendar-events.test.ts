import { describe, expect, it } from 'vitest'
import { shouldTriggerThirteenthMonth } from './calendar-events.js'

describe('calendar-events', () => {
  it('triggers 13th month when entering Jul–Dec (H2)', () => {
    expect(shouldTriggerThirteenthMonth(1, true)).toBe(true)
    expect(shouldTriggerThirteenthMonth(2, true)).toBe(true)
  })

  it('does not trigger when entering Jan–Jun (H1)', () => {
    expect(shouldTriggerThirteenthMonth(2, false)).toBe(false)
  })

  it('does not trigger before year 1', () => {
    expect(shouldTriggerThirteenthMonth(0, true)).toBe(false)
  })
})
