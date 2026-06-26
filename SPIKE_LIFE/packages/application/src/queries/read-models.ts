import type {
  CyclePhase,
  DecisionStrategy,
  LifeStage,
  PriorityLevel,
} from '@spike-life/domain'

export type LensId = 'life' | 'plan' | 'protect' | 'grow' | 'journey'

export interface MoneyDisplay {
  amount: number
  formatted: string
}

export interface LifeScoreView {
  cashFlow: number
  protection: number
  goals: number
  wealth: number
  retirement: number
  impact: number
  overall: number
  rating: string
}

export interface BoardStageView {
  turnNumber: number
  lifeStage: LifeStage
  label: string
  status: 'past' | 'current' | 'future'
}

export interface TurnHistoryView {
  turnNumber: number
  lifeStageLabel: string
  scenarioLabel: string
  lifeScoreOverall: number | null
  completedAt: string
}

export interface DashboardView {
  sessionId: string
  scenarioId: string
  scenarioLabel: string
  phase: CyclePhase
  characterName: string
  age: number
  lifeStage: LifeStage
  lifeStageLabel: string
  simulationYear: number
  turnNumber: number
  maxTurns: number
  canAdvanceTurn: boolean
  workshopComplete: boolean
  canStartScenario: boolean
  boardStages: BoardStageView[]
  turnHistory: TurnHistoryView[]
  lifeScore: LifeScoreView
  monthlyIncome: MoneyDisplay
  monthlySurplus: MoneyDisplay
  netWorth: MoneyDisplay
  topPriority: string | null
  fnaRating: string | null
  currentEvent: {
    title: string
    narrative: string
    learningObjective: string
    financialImpactSummary: string
  } | null
  canDecide: boolean
  canReflect: boolean
  cycleComplete: boolean
}

export interface FnaGapView {
  dimension: string
  dimensionLabel: string
  score: number
  gapPercent: number
  priority: PriorityLevel
  summary: string
}

export interface FnaSummaryView {
  sessionId: string
  phase: CyclePhase
  timing: 'before_decision' | 'after_decision'
  overallScore: number
  rating: string
  topPriority: string
  cashFlowScore: number
  protectionScore: number
  debtScore: number
  goalScore: number
  retirementScore: number
  gaps: FnaGapView[]
  emergencyFundTarget: MoneyDisplay
  emergencyFundProgress: number
}

export interface RecommendationView {
  rank: number
  label: string
  priority: PriorityLevel
  rationale: string
  addressesGap: string
}

export interface GoalView {
  goalId: string
  goalName: string
  targetAmount: MoneyDisplay
  currentFunding: MoneyDisplay
  progressPercent: number
  targetAge: number
  status: 'active' | 'completed'
}

export interface DecisionOptionView {
  strategy: DecisionStrategy
  label: string
  description: string
  alignsWithSolutions: string[]
}

export interface PlanLensView {
  sessionId: string
  phase: CyclePhase
  fna: FnaSummaryView | null
  recommendations: RecommendationView[]
  goals: GoalView[]
  decisionOptions: DecisionOptionView[]
  canDecide: boolean
  selectedStrategy: DecisionStrategy | null
  decisionQuality: string | null
}

export interface ProtectionPlanView {
  category: string
  readinessPercent: number
  gapSummary: string
  priority: PriorityLevel
}

export interface ProtectLensView {
  sessionId: string
  phase: CyclePhase
  overallProtectionScore: number
  plans: ProtectionPlanView[]
  familyProtectionGap: MoneyDisplay
  healthProtectionNeed: MoneyDisplay
}

export interface GrowLensView {
  sessionId: string
  phase: CyclePhase
  cashFlow: {
    monthlyIncome: MoneyDisplay
    monthlyExpenses: MoneyDisplay
    monthlySurplus: MoneyDisplay
    debtRatioPercent: number
  }
  assets: {
    cash: MoneyDisplay
    investments: MoneyDisplay
    property: MoneyDisplay
    business: MoneyDisplay
    total: MoneyDisplay
  }
  liabilities: {
    creditCard: MoneyDisplay
    personalLoan: MoneyDisplay
    housingLoan: MoneyDisplay
    businessLoan: MoneyDisplay
    total: MoneyDisplay
  }
  netWorth: MoneyDisplay
}

export interface JourneyEntryView {
  id: string
  kind: 'event' | 'decision' | 'reflection' | 'milestone'
  title: string
  summary: string
  timestamp: string | null
}

export interface JourneyLensView {
  sessionId: string
  phase: CyclePhase
  timeline: JourneyEntryView[]
  reflection: {
    summary: string
    learningHighlights: string[]
    advisorInsight: string
    prompts: { id: string; question: string }[]
    answers: { promptId: string; response: string }[]
    completed: boolean
  } | null
  advisorReadiness: string | null
}

export type LensView =
  | { lens: 'life'; data: DashboardView }
  | { lens: 'plan'; data: PlanLensView }
  | { lens: 'protect'; data: ProtectLensView }
  | { lens: 'grow'; data: GrowLensView }
  | { lens: 'journey'; data: JourneyLensView }
