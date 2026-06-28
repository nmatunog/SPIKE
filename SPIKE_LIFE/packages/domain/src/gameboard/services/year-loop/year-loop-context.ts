import type { YearLoopConfig } from '@spike-life/content-core'
import { DEFAULT_YEAR_LOOP_CONFIG } from './year-loop-defaults.js'

let activeConfig: YearLoopConfig = DEFAULT_YEAR_LOOP_CONFIG

export function configureYearLoop(config: YearLoopConfig): void {
  activeConfig = config
}

export function getYearLoopConfig(): YearLoopConfig {
  return activeConfig
}

/** Restore engine defaults — for tests. */
export function resetYearLoopConfig(): void {
  activeConfig = DEFAULT_YEAR_LOOP_CONFIG
}

export function getDomainIds(): string[] {
  return activeConfig.domains.map((d) => d.id)
}

export function getDomainAnimationCycle(): readonly string[] {
  return activeConfig.domains.map((d) => d.id)
}
