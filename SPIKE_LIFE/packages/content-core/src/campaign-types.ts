/** Campaign pacing — GDS v1.0 (10 years · 20 semi-annual cycles). */

export type DecisionTimerPreset = 'off' | '5' | '10' | '15' | '20'

export interface DreamBoardGoalDefault {
  goalId: string
  goalName: string
  presentValue: number
  defaultTargetAge: number
  optional?: boolean
  icon?: string
}

export interface DreamBoardDefaults {
  inflationRateAnnual: number
  emergencyFundMonths: number
  goals: DreamBoardGoalDefault[]
}

export interface CampaignConfig {
  totalYears: number
  cyclesPerYear: number
  workshopMacroTurns: number
  decisionTimerSeconds: DecisionTimerPreset
  inflationRateAnnual: number
  dreamBoard: DreamBoardDefaults
  calendarEvents?: CalendarEventsConfig
}

export interface ThirteenthMonthAllocation {
  id: string
  label: string
  description: string
  strategy: string
}

export interface CalendarEventsConfig {
  thirteenthMonthAllocations: ThirteenthMonthAllocation[]
}
