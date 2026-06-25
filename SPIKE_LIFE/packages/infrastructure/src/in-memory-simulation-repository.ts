import type { SimulationRepository } from '@spike-life/domain'
import type { SimulationSession } from '@spike-life/domain'

export class InMemorySimulationRepository implements SimulationRepository {
  private readonly store = new Map<string, SimulationSession>()

  async save(session: SimulationSession): Promise<void> {
    this.store.set(session.id, structuredClone(session))
  }

  async findById(id: string): Promise<SimulationSession | null> {
    const session = this.store.get(id)
    return session ? structuredClone(session) : null
  }

  clear(): void {
    this.store.clear()
  }
}
