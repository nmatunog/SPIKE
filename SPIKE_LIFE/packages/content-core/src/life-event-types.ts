/** Life stage bands — align with domain LifeStage. */
export type LifeEventLifeStage = 'launch' | 'build' | 'grow' | 'lead' | 'legacy'

export type CoreLifeFlagId =
  | 'employed'
  | 'student'
  | 'educationCompleted'
  | 'ownsHouse'
  | 'married'
  | 'partnered'
  | 'hasChildren'
  | 'businessOwner'
  | 'insured'
  | 'emergencyFundComplete'
  | 'retired'
  | 'careerLevel'

export type LifeFlagValue = boolean | string | number

export type LifeFlagState = Record<string, LifeFlagValue>

export interface LifeEventNumericRequirements {
  cashSavings?: { min?: number; max?: number }
  lifeScore?: { min?: number; max?: number }
  employmentCycles?: { min?: number }
}

export interface LifeEventRequirements {
  /** Flag must equal this value (omit key = no constraint). */
  flags?: Partial<Record<string, LifeFlagValue>>
  minimumAge?: number
  maximumAge?: number
  minimumTenureCycles?: number
  numeric?: LifeEventNumericRequirements
  /** Life event ids that must appear in history before this event. */
  completedEvents?: string[]
  lifeStages?: LifeEventLifeStage[]
}

export interface LifeEventBlockers {
  flags?: Partial<Record<string, LifeFlagValue>>
  /** Block if any of these life event ids occurred within blocker window. */
  recentEvents?: string[]
  /** Cycles to look back for recentEvents (default 2). */
  recentWithinCycles?: number
}

export interface LifeEventCooldown {
  cycles: number
}

export interface LifeEventEffects {
  setFlags?: Partial<Record<string, LifeFlagValue>>
}

/**
 * Structured life situation — eligibility, progression, and narrative arcs live here.
 * Links to encounter narrative via `encounterId`.
 */
export interface LifeEventDefinition {
  id: string
  encounterId: string
  domain: string
  title?: string
  weight: number
  repeatable: boolean
  cooldown?: LifeEventCooldown
  requirements?: LifeEventRequirements
  blockers?: LifeEventBlockers
  effects?: LifeEventEffects
  followUpEventIds?: string[]
  storyArcIds?: string[]
  /** Position in a story arc sequence (0-based). */
  arcStep?: number
  /** Chance / disaster events skip progression gates but still respect age weights. */
  bypassProgression?: boolean
  lifeStages?: LifeEventLifeStage[]
}

export interface LifeStoryArcDefinition {
  id: string
  label: string
  domain: string
  durationCycles: { min: number; max: number }
  /** Ordered life event ids — bias toward completing this storyline. */
  sequence: string[]
  /** Weight multiplier for in-arc eligible events (default 3). */
  biasMultiplier?: number
}

export interface LifeEventPack {
  version: number
  events: LifeEventDefinition[]
  arcs?: LifeStoryArcDefinition[]
}
