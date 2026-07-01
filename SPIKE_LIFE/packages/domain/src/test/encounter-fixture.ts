import type { EncounterRecord } from '@spike-life/content-core'
import { configureEncounterRepository } from '../ports/encounter-repository.js'
import type { EncounterRepository } from '../ports/encounter-repository.js'
import { configureLifeEventPack } from '../services/life-event-context.js'
import { PHILIPPINES_LIFE_EVENTS } from '@spike-life/content-philippines'
import { validateLifeEventPack } from '@spike-life/content-core'
import encountersJson from '../../../content-philippines/src/data/encounters/all.json' with { type: 'json' }

class TestEncounterRepository implements EncounterRepository {
  private readonly records = encountersJson as EncounterRecord[]

  getAll() { return this.records }
  getByDomain(domainId: string) {
    return this.records.filter((e) => e.domainId === domainId)
  }
  getById(id: string) {
    return this.records.find((e) => e.id === id) ?? null
  }
}

export function bootstrapTestEncounters(): void {
  configureEncounterRepository(new TestEncounterRepository())
  validateLifeEventPack(PHILIPPINES_LIFE_EVENTS)
  configureLifeEventPack(PHILIPPINES_LIFE_EVENTS)
}
