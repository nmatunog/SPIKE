import { describe, expect, it } from 'vitest'
import { buildSituationShuffleIds } from './situation-shuffle.js'

describe('situation-shuffle', () => {
  it('ends shuffle animation on the selected health encounter', () => {
    const ids = buildSituationShuffleIds('health', 'health', 38, 'minor_injury')
    expect(ids.at(-1)).toBe('minor_injury')
    expect(ids.length).toBeGreaterThanOrEqual(4)
  })

  it('uses age-weighted pool for career at 22', () => {
    const ids = buildSituationShuffleIds('career', 'career', 22, 'first_job')
    expect(ids.at(-1)).toBe('first_job')
  })
})
