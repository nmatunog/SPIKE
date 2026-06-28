import { describe, expect, it } from 'vitest'
import {
  recordHiddenLongTermConsequence,
  revealDueHiddenConsequences,
} from './long-term-consequence-engine.js'

describe('long-term-consequence-engine', () => {
  it('records a hidden consequence on each decision', () => {
    const records = recordHiddenLongTermConsequence(
      'improve_protection',
      'good',
      1,
    )
    expect(records).toHaveLength(1)
    expect(records[0]!.revealed).toBe(false)
    expect(records[0]!.revealsAtYear).toBeGreaterThan(1)
  })

  it('reveals consequences when the year catches up', () => {
    let records = recordHiddenLongTermConsequence(
      'increase_lifestyle',
      'high_risk',
      1,
    )
    const before = revealDueHiddenConsequences(records, 1)
    expect(before.newlyRevealed).toHaveLength(0)

    const after = revealDueHiddenConsequences(before.updated, 4)
    expect(after.newlyRevealed.length).toBeGreaterThan(0)
    expect(after.updated.every((r) => r.revealed || r.revealsAtYear > 4)).toBe(true)
  })
})
