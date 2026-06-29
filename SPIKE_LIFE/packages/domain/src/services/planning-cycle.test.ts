import { describe, expect, it } from 'vitest'
import type { CampaignConfig } from '@spike-life/content-core'
import {
  cycleIndexForMacroTurn,
  cyclesPerMacroTurn,
  formatCycleLabel,
  halfYearFromCycle,
  simulationYearFromCycle,
  isYearEndCycle,
} from './planning-cycle.js'

const campaign: CampaignConfig = {
  totalYears: 10,
  cyclesPerYear: 2,
  workshopMacroTurns: 5,
  decisionTimerSeconds: '15',
  inflationRateAnnual: 0.04,
  dreamBoard: { inflationRateAnnual: 0.04, emergencyFundMonths: 6, goals: [] },
}

describe('planning-cycle', () => {
  it('maps cycle index to half-year labels', () => {
    expect(halfYearFromCycle(1)).toBe('H1')
    expect(halfYearFromCycle(2)).toBe('H2')
    expect(formatCycleLabel(1)).toBe('Jan–Jun · Year 1')
    expect(formatCycleLabel(4)).toBe('Jul–Dec · Year 2')
  })

  it('compresses 20 cycles into 5 macro turns', () => {
    expect(cyclesPerMacroTurn(campaign)).toBe(4)
    expect(cycleIndexForMacroTurn(1, campaign)).toBe(1)
    expect(cycleIndexForMacroTurn(3, campaign)).toBe(9)
    expect(simulationYearFromCycle(8)).toBe(4)
  })

  it('detects year-end cycles', () => {
    expect(isYearEndCycle(2)).toBe(true)
    expect(isYearEndCycle(3)).toBe(false)
  })
})
