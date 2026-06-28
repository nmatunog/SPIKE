import { describe, expect, it } from 'vitest'
import { getLifeDomainGrid, domainById } from './domain-grid.js'
import { selectLifeDomainForYear } from './domain-weights.js'

describe('domain-grid', () => {
  it('defines twelve Philippines-first life domains', () => {
    const grid = getLifeDomainGrid()
    expect(grid).toHaveLength(12)
    expect(grid.some((d) => d.id === 'chance')).toBe(false)
    expect(grid.some((d) => d.id === 'income_finance')).toBe(true)
    expect(grid.some((d) => d.id === 'government')).toBe(true)
  })

  it('selects age-weighted domain at 22', () => {
    expect(selectLifeDomainForYear(22, () => 0).id).toBe('career')
  })

  it('resolves domain by id', () => {
    expect(domainById('housing')?.label).toBe('Housing')
    expect(domainById('missing')).toBeUndefined()
  })
})
