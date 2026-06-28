import type {
  ContentPack,
  FinancialTopicConfig,
  InstitutionConfig,
  YearLoopConfig,
} from '@spike-life/content-core'
import { validateContentPack } from '@spike-life/content-core'

import yearLoopJson from './data/year-loop.json' with { type: 'json' }
import financialTopicsJson from './data/financial-topics.json' with { type: 'json' }
import institutionsJson from './data/institutions.json' with { type: 'json' }
import lifeSituations from './data/life-situations.json' with { type: 'json' }
import manifest from './data/manifest.json' with { type: 'json' }
import strings from './data/strings.en-PH.json' with { type: 'json' }

const institutions = institutionsJson as InstitutionConfig[]
const financialTopics = financialTopicsJson as FinancialTopicConfig[]

const yearLoop = yearLoopJson as YearLoopConfig

/** MVP Philippines content pack — Amendment A4 */
export const PHILIPPINES_CONTENT_PACK: ContentPack = {
  manifest,
  institutions,
  financialTopics,
  lifeSituations,
  strings,
  yearLoop,
}

validateContentPack(PHILIPPINES_CONTENT_PACK)

export { manifest as PHILIPPINES_MANIFEST }
export { institutions as PHILIPPINES_INSTITUTIONS }
export { financialTopics as PHILIPPINES_FINANCIAL_TOPICS }
export { lifeSituations as PHILIPPINES_LIFE_SITUATIONS }
export { strings as PHILIPPINES_STRINGS_EN_PH }
export { yearLoop as PHILIPPINES_YEAR_LOOP }

/** Default currency/locale for MVP bootstrap */
export const DEFAULT_CURRENCY = PHILIPPINES_CONTENT_PACK.manifest.currency
export const DEFAULT_LOCALE = PHILIPPINES_CONTENT_PACK.manifest.defaultLocale
