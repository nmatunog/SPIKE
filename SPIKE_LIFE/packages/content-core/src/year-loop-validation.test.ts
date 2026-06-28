import { describe, expect, it } from 'vitest'
import { validateYearLoopConfig } from './year-loop-validation.js'
import type { YearLoopConfig } from './year-loop-types.js'

const MINIMAL: YearLoopConfig = {
  domains: [{ id: 'career', label: 'Career', category: 'career', icon: 'briefcase', color: '#000' }],
  weightBands: [{ maxAge: 120, label: 'launch', weights: { career: 100 } }],
}

describe('validateYearLoopConfig', () => {
  it('accepts valid config', () => {
    expect(() => validateYearLoopConfig(MINIMAL)).not.toThrow()
  })

  it('rejects unknown domain in weights', () => {
    expect(() =>
      validateYearLoopConfig({
        ...MINIMAL,
        weightBands: [{ maxAge: 120, label: 'launch', weights: { unknown: 1 } }],
      }),
    ).toThrow(/unknown domain/)
  })
})
