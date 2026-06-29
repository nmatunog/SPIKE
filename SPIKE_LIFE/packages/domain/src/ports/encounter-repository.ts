import type { EncounterRecord } from '@spike-life/content-core'

export interface EncounterRepository {
  getAll(): EncounterRecord[]
  getByDomain(domainId: string): EncounterRecord[]
  getById(encounterId: string): EncounterRecord | null
}

let encounterRepo: EncounterRepository | null = null

export function configureEncounterRepository(repo: EncounterRepository): void {
  encounterRepo = repo
}

export function getEncounterRepository(): EncounterRepository {
  if (!encounterRepo) {
    throw new Error('EncounterRepository not configured — bootstrap content pack first.')
  }
  return encounterRepo
}

export function resetEncounterRepository(): void {
  encounterRepo = null
}
