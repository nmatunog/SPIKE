/** Country-neutral content pack contract — Amendment A4 */

export interface CurrencyConfig {
  code: string
  locale: string
  symbol?: string
  maximumFractionDigits?: number
}

export interface LocaleConfig {
  id: string
  label: string
  language: string
  region: string
}

export interface InstitutionConfig {
  id: string
  name: string
  acronym: string
  category: 'social_security' | 'health' | 'housing' | 'tax' | 'other'
  description: string
  /** Optional content key for future program rules — never engine logic */
  programIds?: string[]
}

export interface LifeSituationTemplate {
  id: string
  title: string
  lifeStage?: string
  topics: string[]
  description?: string
}

export interface FinancialTopicConfig {
  id: string
  label: string
  priority: 'core' | 'extended' | 'optional'
}

export interface ContentPackManifest {
  id: string
  /** Links pack to a Financial World edition */
  financialWorldId: string
  countryCode: string
  edition: string
  label: string
  defaultLocale: string
  currency: CurrencyConfig
  supportedLocales: LocaleConfig[]
}

export interface ContentPack {
  manifest: ContentPackManifest
  institutions: InstitutionConfig[]
  financialTopics: FinancialTopicConfig[]
  lifeSituations: LifeSituationTemplate[]
  /** UI strings — keyed by dot path */
  strings: Record<string, string>
  /** Age-weighted domain grid + situation tuning (Amendment A5) */
  yearLoop?: import('./year-loop-types.js').YearLoopConfig
  /** Playable starting personas — GDS v1.0 */
  archetypes?: import('./archetype-types.js').ArchetypePackConfig
  /** Campaign pacing, dream board defaults, calendar events */
  campaign?: import('./campaign-types.js').CampaignConfig
}
