import type { CampaignConfig } from '@spike-life/content-core'

export type HalfYear = 'H1' | 'H2'

const HALF_LABELS: Record<HalfYear, string> = {
  H1: 'Jan–Jun',
  H2: 'Jul–Dec',
}

export function totalCampaignCycles(config: CampaignConfig): number {
  return config.totalYears * config.cyclesPerYear
}

export function cyclesPerMacroTurn(config: CampaignConfig): number {
  return totalCampaignCycles(config) / config.workshopMacroTurns
}

export function simulationYearFromCycle(cycleIndex: number): number {
  return Math.ceil(cycleIndex / 2)
}

export function halfYearFromCycle(cycleIndex: number): HalfYear {
  return cycleIndex % 2 === 1 ? 'H1' : 'H2'
}

export function formatCycleLabel(cycleIndex: number): string {
  const half = halfYearFromCycle(cycleIndex)
  const year = simulationYearFromCycle(cycleIndex)
  return `${HALF_LABELS[half]} · Year ${year}`
}

export function cycleIndexForMacroTurn(
  turnNumber: number,
  config: CampaignConfig,
): number {
  const perMacro = cyclesPerMacroTurn(config)
  return (turnNumber - 1) * perMacro + 1
}

export function ageForCampaignYear(startingAge: number, simulationYear: number): number {
  return startingAge + Math.max(0, simulationYear - 1)
}

export function isYearEndCycle(cycleIndex: number): boolean {
  return cycleIndex % 2 === 0
}

export function timerSecondsFromPreset(
  preset: CampaignConfig['decisionTimerSeconds'],
): number {
  if (preset === 'off') return 0
  return Number.parseInt(preset, 10)
}
