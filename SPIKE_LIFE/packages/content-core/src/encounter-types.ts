export type EncounterEventClass =
  | 'positive'
  | 'negative'
  | 'opportunity'
  | 'crisis'
  | 'milestone'

export type EncounterScenarioTemplate = 'promotion' | 'protection_stress' | 'generic'
export type EncounterSituationKind = 'income_opportunity' | 'protection_stress'

export interface EncounterWeightBands {
  launch?: number
  mid?: number
  late?: number
}

export type EncounterLifeChoiceTone = 'positive' | 'neutral' | 'warning' | 'critical'

export interface EncounterLifeChoice {
  id: string
  label: string
  description?: string
  costLabel?: string
  outcomePreview?: string
  /** Maps to engine DecisionStrategy — hidden from player */
  strategy: string
  tone?: EncounterLifeChoiceTone
}

export interface EncounterRecord {
  id: string
  domainId: string
  eventClass: EncounterEventClass
  intensity: 1 | 2 | 3 | 4
  title: string
  teaser: string
  narrative: string
  learningObjective: string
  scenarioTemplate: EncounterScenarioTemplate
  situationKind: EncounterSituationKind
  /** Contextual life-language choices; generated at runtime if omitted */
  lifeChoices?: EncounterLifeChoice[]
  weights: {
    base: number
    bands?: EncounterWeightBands
    goals?: Record<string, number>
    seasonal?: ('H1' | 'H2')[]
    tags?: string[]
  }
}

export interface EncounterPack {
  version: number
  encounters: EncounterRecord[]
}

export function validateEncounterPack(pack: EncounterPack, domainIds: string[]): void {
  if (!pack.encounters?.length) {
    throw new Error('Encounter pack must contain at least one encounter.')
  }
  const byDomain = new Map<string, number>()
  for (const enc of pack.encounters) {
    if (!enc.id || !enc.domainId || !enc.title) {
      throw new Error(`Invalid encounter record: ${enc.id ?? 'unknown'}`)
    }
    if (!domainIds.includes(enc.domainId)) {
      throw new Error(`Encounter ${enc.id} references unknown domain ${enc.domainId}`)
    }
    byDomain.set(enc.domainId, (byDomain.get(enc.domainId) ?? 0) + 1)
  }
  for (const domainId of domainIds) {
    const count = byDomain.get(domainId) ?? 0
    if (count < 1) {
      throw new Error(`Domain ${domainId} has no encounters in pack`)
    }
  }
}
