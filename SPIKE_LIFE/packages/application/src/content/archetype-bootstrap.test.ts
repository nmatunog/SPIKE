import { describe, expect, it } from 'vitest'
import { PHILIPPINES_CONTENT_PACK } from '@spike-life/content-philippines'
import {
  configureArchetypes,
  getArchetypeIds,
  getArchetypeLabel,
  resetArchetypeConfig,
} from '@spike-life/domain'
import { bootstrapArchetypesFromPack } from './archetype-bootstrap.js'

describe('archetype bootstrap', () => {
  it('loads Philippines personas into the engine', () => {
    resetArchetypeConfig()
    bootstrapArchetypesFromPack(PHILIPPINES_CONTENT_PACK)

    expect(getArchetypeIds()).toHaveLength(6)
    expect(getArchetypeLabel('bpo_professional')).toBe('BPO Professional')
  })

  it('no-ops when pack has no archetypes', () => {
    resetArchetypeConfig()
    bootstrapArchetypesFromPack({ ...PHILIPPINES_CONTENT_PACK, archetypes: undefined })
    expect(getArchetypeIds()).toEqual(['fresh_graduate'])
    configureArchetypes(PHILIPPINES_CONTENT_PACK.archetypes!)
  })
})
