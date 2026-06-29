import type { CampaignConfig } from './campaign-types.js'

export function validateCampaignConfig(config: CampaignConfig): void {
  if (config.totalYears < 1 || config.totalYears > 40) {
    throw new Error('campaign: totalYears out of range')
  }
  if (config.cyclesPerYear < 1 || config.cyclesPerYear > 4) {
    throw new Error('campaign: cyclesPerYear must be 1–4')
  }
  if (config.workshopMacroTurns < 1) {
    throw new Error('campaign: workshopMacroTurns required')
  }
  const totalCycles = config.totalYears * config.cyclesPerYear
  if (totalCycles % config.workshopMacroTurns !== 0) {
    throw new Error(
      `campaign: total cycles (${totalCycles}) must divide evenly by workshopMacroTurns`,
    )
  }
  if (!config.dreamBoard?.goals?.length) {
    throw new Error('campaign: dreamBoard.goals required')
  }
  if (config.inflationRateAnnual < 0 || config.inflationRateAnnual > 0.2) {
    throw new Error('campaign: inflationRateAnnual out of range')
  }
}
