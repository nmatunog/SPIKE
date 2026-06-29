import { describe, expect, it } from 'vitest'
import { isPhilippinesEdition, resolveString } from '@spike-life/content-core'
import { PHILIPPINES_CONTENT_PACK } from './index.js'

describe('PHILIPPINES_CONTENT_PACK', () => {
  it('is a valid Philippines edition', () => {
    expect(isPhilippinesEdition(PHILIPPINES_CONTENT_PACK.manifest)).toBe(true)
    expect(PHILIPPINES_CONTENT_PACK.manifest.currency.code).toBe('PHP')
  })

  it('includes core institutions as data', () => {
    const ids = PHILIPPINES_CONTENT_PACK.institutions.map((i) => i.id)
    expect(ids).toContain('sss')
    expect(ids).toContain('philhealth')
    expect(ids).toContain('pagibig')
    expect(ids).toContain('bir')
  })

  it('resolves UI strings', () => {
    expect(resolveString(PHILIPPINES_CONTENT_PACK, 'app.edition')).toBe('Philippine Financial World')
  })

  it('includes facilitator-tunable year loop config', () => {
    expect(PHILIPPINES_CONTENT_PACK.yearLoop?.domains).toHaveLength(12)
    expect(PHILIPPINES_CONTENT_PACK.yearLoop?.weightBands).toHaveLength(3)
    expect(PHILIPPINES_CONTENT_PACK.yearLoop?.advisorInsightProbability).toBe(0.27)
    expect(PHILIPPINES_CONTENT_PACK.yearLoop?.encounterWeightOverrides?.length).toBeGreaterThan(0)
  })

  it('includes six random-assignable personas', () => {
    expect(PHILIPPINES_CONTENT_PACK.archetypes?.archetypes).toHaveLength(6)
    expect(PHILIPPINES_CONTENT_PACK.archetypes?.assignment.maxPlayers).toBe(6)
    expect(PHILIPPINES_CONTENT_PACK.archetypes?.assignment.minPlayers).toBe(2)
  })
})
