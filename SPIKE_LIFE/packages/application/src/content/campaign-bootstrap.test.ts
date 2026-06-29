import { describe, expect, it } from 'vitest'
import { PHILIPPINES_CONTENT_PACK } from '@spike-life/content-philippines'
import { bootstrapCampaignFromPack } from './campaign-bootstrap.js'
import { getWorkshopMacroTurns, getMaxCampaignCycles } from '@spike-life/domain'

describe('bootstrapCampaignFromPack', () => {
  it('loads Philippines campaign config', () => {
    bootstrapCampaignFromPack(PHILIPPINES_CONTENT_PACK)
    expect(getWorkshopMacroTurns()).toBe(5)
    expect(getMaxCampaignCycles()).toBe(20)
  })
})
