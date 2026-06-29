import { describe, expect, it } from 'vitest'
import { PHILIPPINES_ARCHETYPES } from '@spike-life/content-philippines'
import {
  configureArchetypes,
  createArchetypeBundle,
  resetArchetypeConfig,
} from './archetype-context.js'
import { pickRandomArchetypeId, pickSoloArchetypeId } from './archetype-selection.js'

describe('archetype-selection', () => {
  it('assigns unique personas for six players', () => {
    configureArchetypes(PHILIPPINES_ARCHETYPES)
    const used: string[] = []
    for (let i = 0; i < 6; i += 1) {
      const id = pickRandomArchetypeId(used, () => 0)
      expect(used.includes(id)).toBe(false)
      used.push(id)
    }
    expect(used).toHaveLength(6)
    resetArchetypeConfig()
  })

  it('creates bundles with distinct ages', () => {
    configureArchetypes(PHILIPPINES_ARCHETYPES)
    const fresh = createArchetypeBundle('fresh_graduate')
    const ofw = createArchetypeBundle('ofw_breadwinner')
    expect(fresh.character.age).toBe(22)
    expect(ofw.character.age).toBe(35)
    expect(ofw.character.dependents).toBe(3)
    resetArchetypeConfig()
  })

  it('picks deterministic solo archetype from seed', () => {
    configureArchetypes(PHILIPPINES_ARCHETYPES)
    const a = pickSoloArchetypeId('browser-demo', () => 0)
    const b = pickSoloArchetypeId('browser-demo', () => 0)
    expect(a).toBe(b)
    resetArchetypeConfig()
  })
})
