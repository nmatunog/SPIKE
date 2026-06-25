import type { SimulationSession } from '../aggregates/simulation-session.js'

export interface SimulationRepository {
  save(session: SimulationSession): Promise<void>
  findById(id: string): Promise<SimulationSession | null>
}
