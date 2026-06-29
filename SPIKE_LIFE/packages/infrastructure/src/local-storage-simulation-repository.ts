import type { SimulationRepository, SimulationState } from '@spike-life/domain'

const STORAGE_KEY = 'spike-life-simulations'

function readAll(key: string): Map<string, SimulationState> {
  const map = new Map<string, SimulationState>()
  if (typeof localStorage === 'undefined') return map
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return map
    const entries = JSON.parse(raw) as SimulationState[]
    for (const state of entries) map.set(state.id, state)
  } catch {
    // ignore
  }
  return map
}

function writeAll(key: string, map: Map<string, SimulationState>): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify([...map.values()]))
  } catch {
    // quota
  }
}

/** Persists simulations to localStorage — survives browser refresh (Phase 7 MVP). */
export class LocalStorageSimulationRepository implements SimulationRepository {
  private readonly store: Map<string, SimulationState>

  constructor(private readonly storageKey = STORAGE_KEY) {
    this.store = readAll(storageKey)
  }

  async save(session: SimulationState): Promise<void> {
    this.store.set(session.id, structuredClone(session))
    writeAll(this.storageKey, this.store)
  }

  async findById(id: string): Promise<SimulationState | null> {
    const session = this.store.get(id)
    return session ? structuredClone(session) : null
  }

  clear(): void {
    this.store.clear()
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey)
    }
  }
}
