import type { ContentPack, EncounterPack, EncounterRecord } from '@spike-life/content-core'
import { validateEncounterPack } from '@spike-life/content-core'
import type { EncounterRepository } from '@spike-life/domain'
import { configureEncounterRepository } from '@spike-life/domain'
import { PHILIPPINES_ENCOUNTERS } from '@spike-life/content-philippines'

export class PackEncounterRepository implements EncounterRepository {
  private readonly byId = new Map<string, EncounterRecord>()
  private readonly byDomain = new Map<string, EncounterRecord[]>()

  constructor(pack: EncounterPack) {
    for (const enc of pack.encounters) {
      this.byId.set(enc.id, enc)
      const list = this.byDomain.get(enc.domainId) ?? []
      list.push(enc)
      this.byDomain.set(enc.domainId, list)
    }
  }

  getAll(): EncounterRecord[] {
    return [...this.byId.values()]
  }

  getByDomain(domainId: string): EncounterRecord[] {
    return [...(this.byDomain.get(domainId) ?? [])]
  }

  getById(encounterId: string): EncounterRecord | null {
    return this.byId.get(encounterId) ?? null
  }
}

export function bootstrapEncountersFromPack(pack: ContentPack): void {
  const domainIds = pack.yearLoop?.domains.map((d) => d.id) ?? []
  const encounterPack: EncounterPack = {
    version: 1,
    encounters: PHILIPPINES_ENCOUNTERS as EncounterRecord[],
  }
  validateEncounterPack(encounterPack, domainIds)
  configureEncounterRepository(new PackEncounterRepository(encounterPack))
}
