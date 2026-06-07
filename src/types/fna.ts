/** SPIKE FNA Engine — Financial Needs Analysis (Sprint 04 PR4.2). */

export type FnaStatus = 'draft' | 'completed' | 'presented' | 'implemented'

export interface FnaRecommendation {
  id: string
  title: string
  description: string
  priority: number
}

export interface FinancialNeedsAnalysis {
  id: string
  participantId: string
  clientName: string
  clientAge: number | null
  dependents: number
  income: number | null
  assets: number | null
  liabilities: number | null
  protectionGap: number | null
  retirementGap: number | null
  status: FnaStatus
  notes: string
  recommendations: FnaRecommendation[]
  createdAt: string
  updatedAt: string
}

export interface ClientGrowthFunnel {
  prospects: number
  contacts: number
  appointments: number
  fnas: number
  proposals: number
  applications: number
  issuedCases: number
  referrals: number
}
