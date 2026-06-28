import { describe, expect, it } from 'vitest'
import { pickWeightedEncounter } from './situation-weights.js'

describe('situation-weights', () => {
  it('favors first job for career domain at age 22', () => {
    const id = pickWeightedEncounter('career', 'career', 22, () => 0)
    expect(id).toBe('first_job')
  })

  it('can select late-career situations at age 58', () => {
    const id = pickWeightedEncounter('career', 'career', 58, () => 0.55)
    expect(['executive_promotion', 'retirement_offer', 'redundancy', 'consulting_opportunity']).toContain(id)
  })

  it('picks health situations for health domain', () => {
    const id = pickWeightedEncounter('health', 'health', 38, () => 0)
    expect(['annual_checkup', 'minor_injury', 'hospitalization', 'medical_expense']).toContain(id)
  })
})
