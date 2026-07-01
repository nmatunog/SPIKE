import type { ContentPack } from '@spike-life/content-core'
import { validateLifeEventPack } from '@spike-life/content-core'
import { configureLifeEventPack } from '@spike-life/domain'

export function bootstrapLifeEventsFromPack(pack: ContentPack): void {
  if (!pack.lifeEvents) {
    configureLifeEventPack(null)
    return
  }
  validateLifeEventPack(pack.lifeEvents)
  configureLifeEventPack(pack.lifeEvents)
}
