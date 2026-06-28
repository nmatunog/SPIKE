import { describe, expect, it } from 'vitest'
import { PHILIPPINES_CONTENT_PACK } from '@spike-life/content-philippines'
import {
  configureYearLoop,
  getLifeDomainGrid,
  getYearLoopConfig,
  resetYearLoopConfig,
  selectLifeDomainForYear,
} from '@spike-life/domain'
import { bootstrapYearLoopFromPack } from './year-loop-bootstrap.js'

describe('year-loop bootstrap', () => {
  it('loads Philippines year loop tables into the engine', () => {
    resetYearLoopConfig()
    bootstrapYearLoopFromPack(PHILIPPINES_CONTENT_PACK)

    expect(getLifeDomainGrid()).toHaveLength(12)
    expect(getYearLoopConfig().advisorInsightProbability).toBe(0.27)
    expect(selectLifeDomainForYear(22, () => 0).id).toBe('career')
  })

  it('no-ops when pack has no yearLoop', () => {
    resetYearLoopConfig()
    const before = getLifeDomainGrid().length
    bootstrapYearLoopFromPack({ ...PHILIPPINES_CONTENT_PACK, yearLoop: undefined })
    expect(getLifeDomainGrid()).toHaveLength(before)
    configureYearLoop(PHILIPPINES_CONTENT_PACK.yearLoop!)
  })
})
