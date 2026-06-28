import { describe, expect, it } from 'vitest'
import { rollCategoryDie, categoryForDieValue } from './category-die.js'
import { pickEncounterForCategory, rollSituationDie } from './situation-die.js'

describe('Year loop dice (A5)', () => {
  it('maps category die values to life domains', () => {
    expect(categoryForDieValue(1).category).toBe('career')
    expect(categoryForDieValue(4).category).toBe('health')
  })

  it('picks an encounter from the rolled category', () => {
    const face = rollCategoryDie(() => 0)
    const situationRoll = rollSituationDie(() => 0.99)
    const encounterId = pickEncounterForCategory(face.category, situationRoll)
    expect(encounterId).toBeTruthy()
  })
})
