import type { ContentPack } from '@spike-life/content-core'
import { validateYearLoopConfig } from '@spike-life/content-core'
import { configureYearLoop } from '@spike-life/domain'

/** Load age-weighted year loop tables from the active content pack. */
export function bootstrapYearLoopFromPack(pack: ContentPack): void {
  if (!pack.yearLoop) return
  validateYearLoopConfig(pack.yearLoop)
  configureYearLoop(pack.yearLoop)
}
