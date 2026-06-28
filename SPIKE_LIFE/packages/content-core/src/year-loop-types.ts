/** Life domain tile on the 4×3 year-reveal grid (Amendment A5). */
export interface LifeDomainTileConfig {
  id: string
  label: string
  /** Engine space category for encounter routing */
  category: string
  icon: string
  color: string
}

export type LifeStageBand = 'launch' | 'mid' | 'late'

/** Age band → domain selection weights (facilitator-tunable). */
export interface DomainWeightBandConfig {
  /** Inclusive maximum age for this band */
  maxAge: number
  label: LifeStageBand
  weights: Record<string, number>
}

/** Override situation weights without changing engine encounter definitions. */
export interface EncounterWeightOverride {
  id: string
  domainIds?: string[]
  weightsByBand?: Partial<Record<LifeStageBand, number>>
}

/** Content-pack year loop — domains, weights, advisor cadence (Amendment A4 + A5). */
export interface YearLoopConfig {
  domains: LifeDomainTileConfig[]
  weightBands: DomainWeightBandConfig[]
  advisorInsightProbability?: number
  encounterWeightOverrides?: EncounterWeightOverride[]
}
