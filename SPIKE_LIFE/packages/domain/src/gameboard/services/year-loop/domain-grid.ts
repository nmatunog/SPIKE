import type { SpaceType } from '../../types.js'
import { getDomainAnimationCycle, getYearLoopConfig } from './year-loop-context.js'

export interface LifeDomainTile {
  id: string
  label: string
  category: SpaceType
  icon: string
  color: string
}

export function getLifeDomainGrid(): LifeDomainTile[] {
  return getYearLoopConfig().domains.map((domain) => ({
    id: domain.id,
    label: domain.label,
    category: domain.category as SpaceType,
    icon: domain.icon,
    color: domain.color,
  }))
}

export function getDomainAnimationCycleIds(): readonly string[] {
  return getDomainAnimationCycle()
}

export function domainById(id: string): LifeDomainTile | undefined {
  return getLifeDomainGrid().find((d) => d.id === id)
}
