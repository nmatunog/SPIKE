import { describe, expect, it } from 'vitest'
import { shouldTriggerThirteenthMonth } from './calendar-events.js'

describe('calendar-events', () => {
  it('does not trigger while 13th month is disabled for solo UX', () => {
    expect(shouldTriggerThirteenthMonth(1, true)).toBe(false)
    expect(shouldTriggerThirteenthMonth(2, true)).toBe(false)
    expect(shouldTriggerThirteenthMonth(2, false)).toBe(false)
    expect(shouldTriggerThirteenthMonth(0, true)).toBe(false)
  })
})
