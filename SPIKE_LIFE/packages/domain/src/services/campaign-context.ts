import type { CampaignConfig, CalendarEventsConfig } from '@spike-life/content-core'
import {
  cyclesPerMacroTurn,
  timerSecondsFromPreset,
  totalCampaignCycles,
} from './planning-cycle.js'

const DEFAULT_CAMPAIGN: CampaignConfig = {
  totalYears: 10,
  cyclesPerYear: 2,
  workshopMacroTurns: 5,
  decisionTimerSeconds: '15',
  inflationRateAnnual: 0.04,
  dreamBoard: {
    inflationRateAnnual: 0.04,
    emergencyFundMonths: 6,
    goals: [],
  },
}

let campaignConfig: CampaignConfig = DEFAULT_CAMPAIGN
let calendarEvents: CalendarEventsConfig = { thirteenthMonthAllocations: [] }

export function configureCampaign(config: CampaignConfig): void {
  campaignConfig = config
}

export function configureCalendarEvents(events: CalendarEventsConfig): void {
  calendarEvents = events
}

export function resetCampaignConfig(): void {
  campaignConfig = DEFAULT_CAMPAIGN
  calendarEvents = { thirteenthMonthAllocations: [] }
}

export function getCampaignConfig(): CampaignConfig {
  return campaignConfig
}

export function getCalendarEvents(): CalendarEventsConfig {
  return calendarEvents
}

export function getWorkshopMacroTurns(): number {
  return campaignConfig.workshopMacroTurns
}

export function getMaxCampaignCycles(): number {
  return totalCampaignCycles(campaignConfig)
}

export function getCyclesPerMacroTurn(): number {
  return cyclesPerMacroTurn(campaignConfig)
}

export function getDefaultDecisionTimerSeconds(): number {
  return timerSecondsFromPreset(campaignConfig.decisionTimerSeconds)
}

export function getInflationRate(): number {
  return campaignConfig.inflationRateAnnual
}
