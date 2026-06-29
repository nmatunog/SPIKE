import type { ContentPack, ContentPackManifest, CurrencyConfig } from './types.js'
import { isKnownFinancialWorldId } from './financial-worlds.js'
import { validateYearLoopConfig } from './year-loop-validation.js'
import { validateArchetypePackConfig } from './archetype-validation.js'
import { validateCampaignConfig } from './campaign-validation.js'

export function validateContentPack(pack: ContentPack): void {
  if (!pack.manifest?.id) throw new Error('Content pack missing manifest.id')
  if (!pack.manifest.financialWorldId) throw new Error('Content pack missing financialWorldId')
  if (!isKnownFinancialWorldId(pack.manifest.financialWorldId)) {
    throw new Error(`Unknown financialWorldId: ${pack.manifest.financialWorldId}`)
  }
  if (!pack.manifest.currency?.code) throw new Error('Content pack missing currency.code')
  if (!pack.manifest.defaultLocale) throw new Error('Content pack missing defaultLocale')
  if (pack.yearLoop) {
    validateYearLoopConfig(pack.yearLoop)
  }
  if (pack.archetypes) {
    validateArchetypePackConfig(pack.archetypes)
  }
  if (pack.campaign) {
    validateCampaignConfig(pack.campaign)
  }
}

export function resolveString(pack: ContentPack, key: string, fallback = ''): string {
  return pack.strings[key] ?? fallback
}

export function currencyConfigFromPack(pack: ContentPack): CurrencyConfig {
  return pack.manifest.currency
}

export function isPhilippinesEdition(manifest: ContentPackManifest): boolean {
  return manifest.countryCode === 'PH'
}
