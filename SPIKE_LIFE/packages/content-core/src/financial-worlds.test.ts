import { describe, expect, it } from 'vitest'
import {
  FINANCIAL_WORLDS,
  MVP_FINANCIAL_WORLD_ID,
  availableFinancialWorlds,
  getFinancialWorld,
} from './financial-worlds.js'

describe('FINANCIAL_WORLDS', () => {
  it('lists five planned product worlds', () => {
    expect(FINANCIAL_WORLDS).toHaveLength(5)
    expect(FINANCIAL_WORLDS.map((w) => w.title)).toEqual([
      'Philippine Financial World',
      'Singapore Financial World',
      'Australian Financial World',
      'American Financial World',
      'Indonesian Financial World',
    ])
  })

  it('ships Philippines as the MVP world', () => {
    expect(MVP_FINANCIAL_WORLD_ID).toBe('philippines')
    const ph = getFinancialWorld('philippines')
    expect(ph.status).toBe('available')
    expect(ph.contentPackId).toBe('philippines')
    expect(availableFinancialWorlds()).toHaveLength(1)
  })
})
