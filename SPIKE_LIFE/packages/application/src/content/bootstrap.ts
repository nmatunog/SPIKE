import {
  getFinancialWorld,
  MVP_FINANCIAL_WORLD_ID,
} from '@spike-life/content-core'
import { DEFAULT_CURRENCY, PHILIPPINES_CONTENT_PACK } from '@spike-life/content-philippines'
import { bootstrapYearLoopFromPack } from './year-loop-bootstrap.js'
import { bootstrapArchetypesFromPack } from './archetype-bootstrap.js'
import { bootstrapCampaignFromPack } from './campaign-bootstrap.js'
import { bootstrapEncountersFromPack } from './encounter-bootstrap.js'

bootstrapYearLoopFromPack(PHILIPPINES_CONTENT_PACK)
bootstrapArchetypesFromPack(PHILIPPINES_CONTENT_PACK)
bootstrapCampaignFromPack(PHILIPPINES_CONTENT_PACK)
bootstrapEncountersFromPack(PHILIPPINES_CONTENT_PACK)

export { DEFAULT_CURRENCY, PHILIPPINES_CONTENT_PACK }

export const ACTIVE_FINANCIAL_WORLD_ID =
  PHILIPPINES_CONTENT_PACK.manifest.financialWorldId as typeof MVP_FINANCIAL_WORLD_ID

export const ACTIVE_FINANCIAL_WORLD = getFinancialWorld(ACTIVE_FINANCIAL_WORLD_ID)
