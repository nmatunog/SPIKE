import type { ContentPack, CampaignConfig, CalendarEventsConfig } from '@spike-life/content-core'
import { validateCampaignConfig } from '@spike-life/content-core'
import { configureCampaign, configureCalendarEvents } from '@spike-life/domain'

/** Load campaign pacing + dream board defaults from the active content pack. */
export function bootstrapCampaignFromPack(pack: ContentPack): void {
  if (!pack.campaign) return
  validateCampaignConfig(pack.campaign)
  configureCampaign(pack.campaign)
  if (pack.campaign.calendarEvents) {
    configureCalendarEvents(pack.campaign.calendarEvents)
  }
}

export type { CampaignConfig, CalendarEventsConfig }
