import type { SimulationRepository, SimulationSession } from '@spike-life/domain'
import type {
  DashboardView,
  FnaSummaryView,
  LensId,
  LensView,
} from './queries/read-models.js'
import {
  projectDashboard,
  projectFnaSummary,
  projectLensView,
} from './queries/projections.js'

export class FinancialDecisionQueryBus {
  constructor(private readonly repository: SimulationRepository) {}

  /** @deprecated Prefer getDashboard — returns raw aggregate */
  async getSession(sessionId: string): Promise<SimulationSession | null> {
    return this.repository.findById(sessionId)
  }

  async getDashboard(sessionId: string): Promise<DashboardView | null> {
    const session = await this.repository.findById(sessionId)
    if (!session) return null
    return projectDashboard(session)
  }

  async getFnaSummary(sessionId: string): Promise<FnaSummaryView | null> {
    const session = await this.repository.findById(sessionId)
    if (!session) return null
    return projectFnaSummary(session)
  }

  async getLensView(sessionId: string, lens: LensId): Promise<LensView | null> {
    const session = await this.repository.findById(sessionId)
    if (!session) return null
    return projectLensView(session, lens)
  }
}
