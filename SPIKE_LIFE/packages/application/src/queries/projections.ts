import type { SimulationSession } from '@spike-life/domain'
import {
  calculateLifeScore,
  buildReflectionPrompts,
  decisionQualityLabel,
  getDecisionOptions,
  monthlySurplus,
  netWorth,
  totalAssets,
  totalLiabilities,
  WORKSHOP_MAX_TURNS,
  WORKSHOP_STAGE_ORDER,
  workshopStageLabel,
} from '@spike-life/domain'
import type {
  DashboardView,
  FnaGapView,
  FnaSummaryView,
  GrowLensView,
  JourneyEntryView,
  JourneyLensView,
  LensId,
  LensView,
  MoneyDisplay,
  PlanLensView,
  ProtectLensView,
  RecommendationView,
  BoardStageView,
  TurnHistoryView,
} from './read-models.js'

const LIFE_STAGE_LABELS: Record<string, string> = {
  launch: 'Launch',
  build: 'Build',
  grow: 'Grow',
  lead: 'Lead',
  legacy: 'Legacy',
}

const GAP_DIMENSION_LABELS: Record<string, string> = {
  cashFlow: 'Cash Flow',
  protection: 'Protection',
  debt: 'Debt',
  goals: 'Goals',
  retirement: 'Retirement',
}

export function formatPeso(amount: number): MoneyDisplay {
  return {
    amount,
    formatted: `₱${amount.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`,
  }
}

function activeFna(session: SimulationSession) {
  return session.fnaAfterDecision ?? session.fnaBeforeDecision
}

function fnaTiming(session: SimulationSession): FnaSummaryView['timing'] {
  return session.fnaAfterDecision ? 'after_decision' : 'before_decision'
}

export function projectFnaSummary(session: SimulationSession): FnaSummaryView | null {
  const fna = activeFna(session)
  if (!fna) return null

  const gaps: FnaGapView[] = fna.gaps.map((gap) => ({
    dimension: gap.dimension,
    dimensionLabel: GAP_DIMENSION_LABELS[gap.dimension] ?? gap.dimension,
    score: gap.score,
    gapPercent: gap.gapPercent,
    priority: gap.priority,
    summary: gap.summary,
  }))

  return {
    sessionId: session.id,
    phase: session.phase,
    timing: fnaTiming(session),
    overallScore: fna.overallScore,
    rating: fna.rating,
    topPriority: fna.topPriority,
    cashFlowScore: fna.cashFlowScore,
    protectionScore: fna.protectionScore,
    debtScore: fna.debtScore,
    goalScore: fna.goalScore,
    retirementScore: fna.retirementScore,
    gaps,
    emergencyFundTarget: formatPeso(fna.emergencyFundTarget),
    emergencyFundProgress: fna.emergencyFundProgress,
  }
}

const SCENARIO_LABELS: Record<string, string> = {
  promotion: 'Promotion',
  protection_stress: 'Family Health Concern',
}

function projectBoardStages(turnNumber: number): BoardStageView[] {
  return WORKSHOP_STAGE_ORDER.map((stage, index) => {
    const stageTurn = index + 1
    let status: BoardStageView['status'] = 'future'
    if (stageTurn < turnNumber) status = 'past'
    if (stageTurn === turnNumber) status = 'current'

    return {
      turnNumber: stageTurn,
      lifeStage: stage,
      label: workshopStageLabel(stage),
      status,
    }
  })
}

function projectTurnHistory(session: SimulationSession): TurnHistoryView[] {
  return session.turnHistory.map((record) => ({
    turnNumber: record.turnNumber,
    lifeStageLabel: workshopStageLabel(record.lifeStage),
    scenarioLabel: SCENARIO_LABELS[record.scenarioId] ?? record.scenarioId,
    lifeScoreOverall: record.lifeScoreOverall,
    completedAt: record.completedAt,
  }))
}

export function projectDashboard(session: SimulationSession): DashboardView {
  const fna = activeFna(session)
  const profile = session.financialProfile
  const decisionQuality = session.consequence?.decisionQuality ?? null
  const lifeScore = fna
    ? calculateLifeScore(fna, profile, decisionQuality)
    : {
        cashFlow: 0,
        protection: 0,
        goals: 0,
        wealth: 0,
        retirement: 0,
        impact: 70,
        overall: 0,
        rating: 'Not yet assessed',
      }

  return {
    sessionId: session.id,
    scenarioId: session.scenarioId,
    scenarioLabel: SCENARIO_LABELS[session.scenarioId] ?? session.scenarioId,
    phase: session.phase,
    characterName: session.character.name,
    age: session.character.age,
    lifeStage: session.character.lifeStage,
    lifeStageLabel: LIFE_STAGE_LABELS[session.character.lifeStage] ?? session.character.lifeStage,
    simulationYear: session.simulationYear ?? 1,
    turnNumber: session.turnNumber ?? 1,
    maxTurns: session.maxTurns ?? WORKSHOP_MAX_TURNS,
    canAdvanceTurn:
      session.phase === 'cycle_complete'
      && (session.turnNumber ?? 1) < (session.maxTurns ?? WORKSHOP_MAX_TURNS),
    workshopComplete:
      session.phase === 'cycle_complete'
      && (session.turnNumber ?? 1) >= (session.maxTurns ?? WORKSHOP_MAX_TURNS),
    canStartScenario: session.phase === 'created',
    boardStages: projectBoardStages(session.turnNumber ?? 1),
    turnHistory: projectTurnHistory({
      ...session,
      turnHistory: session.turnHistory ?? [],
    }),
    lifeScore,
    monthlyIncome: formatPeso(profile.monthlyIncome),
    monthlySurplus: formatPeso(monthlySurplus(profile)),
    netWorth: formatPeso(netWorth(profile)),
    topPriority: fna?.topPriority ?? null,
    fnaRating: fna?.rating ?? null,
    currentEvent: session.situation
      ? {
          title: session.situation.title,
          narrative: session.situation.narrative,
          learningObjective: session.situation.learningObjective,
          financialImpactSummary: session.situation.financialImpactSummary,
        }
      : null,
    canDecide: session.phase === 'decision_pending',
    canReflect: session.phase === 'consequences_applied',
    cycleComplete: session.phase === 'cycle_complete',
  }
}

export function projectPlanLens(session: SimulationSession): PlanLensView {
  const recommendations: RecommendationView[] = session.recommendations.map((rec) => ({
    rank: rec.rank,
    label: rec.label,
    priority: rec.priority,
    rationale: rec.rationale,
    addressesGap: rec.addressesGap,
  }))

  const goals = session.goalPortfolio.goals.map((goal) => ({
    goalId: goal.goalId,
    goalName: goal.goalName,
    targetAmount: formatPeso(goal.targetAmount),
    currentFunding: formatPeso(goal.currentFunding),
    progressPercent: goal.targetAmount > 0
      ? Math.round(Math.min(100, (goal.currentFunding / goal.targetAmount) * 100))
      : 0,
    targetAge: goal.targetAge,
    status: goal.status,
  }))

  return {
    sessionId: session.id,
    phase: session.phase,
    fna: projectFnaSummary(session),
    recommendations,
    goals,
    decisionOptions: getDecisionOptions(session.scenarioId).map((opt) => ({
      strategy: opt.strategy,
      label: opt.label,
      description: opt.description,
      alignsWithSolutions: opt.alignsWithSolutions,
    })),
    canDecide: session.phase === 'decision_pending',
    selectedStrategy: session.decision?.strategy ?? null,
    decisionQuality: session.consequence
      ? decisionQualityLabel(session.consequence.decisionQuality)
      : null,
  }
}

export function projectProtectLens(session: SimulationSession): ProtectLensView {
  const fna = activeFna(session)
  const protection = session.protectionPortfolio
  const profile = session.financialProfile

  const familyNeed = fna?.familyProtectionNeed ?? 0
  const familyCover = protection.lifeCover
  const familyReadiness = familyNeed > 0 ? Math.min(100, Math.round((familyCover / familyNeed) * 100)) : 100

  const healthNeed = fna?.healthProtectionNeed ?? 500_000
  const healthCover = protection.medicalCover + protection.criticalIllnessCover
  const healthReadiness = healthNeed > 0 ? Math.min(100, Math.round((healthCover / healthNeed) * 100)) : 100

  const incomeNeed = profile.monthlyIncome * 12 * 2
  const incomeReadiness = incomeNeed > 0
    ? Math.min(100, Math.round((protection.incomeProtectionCover / incomeNeed) * 100))
    : 100

  const educationReadiness = session.character.dependents > 0 ? 30 : 100
  const retirementReadiness = fna?.retirementScore ?? 0

  const plans = [
    {
      category: 'Family Protection Plan',
      readinessPercent: familyReadiness,
      gapSummary: fna
        ? `Gap of ${formatPeso(fna.familyProtectionGap).formatted} against need.`
        : 'Assessment pending.',
      priority: familyReadiness < 50 ? 'critical' as const : familyReadiness < 75 ? 'high' as const : 'medium' as const,
    },
    {
      category: 'Health Protection Plan',
      readinessPercent: healthReadiness,
      gapSummary: `Readiness at ${healthReadiness}% of health protection need.`,
      priority: healthReadiness < 50 ? 'critical' as const : healthReadiness < 75 ? 'high' as const : 'medium' as const,
    },
    {
      category: 'Income Protection Plan',
      readinessPercent: incomeReadiness,
      gapSummary: `Income protection readiness at ${incomeReadiness}%.`,
      priority: incomeReadiness < 50 ? 'high' as const : 'medium' as const,
    },
    {
      category: 'Education Protection Plan',
      readinessPercent: educationReadiness,
      gapSummary: session.character.dependents > 0
        ? 'Education goals need protection planning.'
        : 'No dependents — education protection not yet applicable.',
      priority: session.character.dependents > 0 ? 'medium' as const : 'low' as const,
    },
    {
      category: 'Retirement Security Plan',
      readinessPercent: retirementReadiness,
      gapSummary: fna
        ? `Retirement funding at ${fna.retirementScore}% of long-term target.`
        : 'Assessment pending.',
      priority: retirementReadiness < 50 ? 'high' as const : 'medium' as const,
    },
  ]

  return {
    sessionId: session.id,
    phase: session.phase,
    overallProtectionScore: fna?.protectionScore ?? 0,
    plans,
    familyProtectionGap: formatPeso(fna?.familyProtectionGap ?? 0),
    healthProtectionNeed: formatPeso(fna?.healthProtectionNeed ?? 0),
  }
}

export function projectGrowLens(session: SimulationSession): GrowLensView {
  const profile = session.financialProfile
  const income = profile.monthlyIncome
  const debtRatio = income > 0
    ? Math.round((profile.monthlyDebtPayments / income) * 100)
    : 0

  return {
    sessionId: session.id,
    phase: session.phase,
    cashFlow: {
      monthlyIncome: formatPeso(profile.monthlyIncome),
      monthlyExpenses: formatPeso(profile.monthlyExpenses),
      monthlySurplus: formatPeso(monthlySurplus(profile)),
      debtRatioPercent: debtRatio,
    },
    assets: {
      cash: formatPeso(profile.cash),
      investments: formatPeso(profile.investments),
      property: formatPeso(profile.propertyValue),
      business: formatPeso(profile.businessValue),
      total: formatPeso(totalAssets(profile)),
    },
    liabilities: {
      creditCard: formatPeso(profile.creditCardDebt),
      personalLoan: formatPeso(profile.personalLoan),
      housingLoan: formatPeso(profile.housingLoan),
      businessLoan: formatPeso(profile.businessLoan),
      total: formatPeso(totalLiabilities(profile)),
    },
    netWorth: formatPeso(netWorth(profile)),
  }
}

export function projectJourneyLens(session: SimulationSession): JourneyLensView {
  const timeline: JourneyEntryView[] = []

  for (const record of session.turnHistory) {
    timeline.push({
      id: `turn-${record.turnNumber}`,
      kind: 'milestone',
      title: `Turn ${record.turnNumber} — ${workshopStageLabel(record.lifeStage)}`,
      summary: `${SCENARIO_LABELS[record.scenarioId] ?? record.scenarioId}${
        record.lifeScoreOverall != null ? ` · Life Score ${record.lifeScoreOverall}` : ''
      }`,
      timestamp: record.completedAt,
    })
  }

  if (session.situation) {
    timeline.push({
      id: session.situation.eventId,
      kind: 'event',
      title: session.situation.title,
      summary: session.situation.narrative,
      timestamp: session.createdAt,
    })
  }

  if (session.discovery) {
    timeline.push({
      id: 'discovery',
      kind: 'milestone',
      title: 'Discovery Complete',
      summary: `${session.discovery.observations.length} financial observations recorded.`,
      timestamp: session.discovery.generatedAt,
    })
  }

  if (session.decision) {
    timeline.push({
      id: 'decision',
      kind: 'decision',
      title: `Decision: ${session.decision.strategy.replace(/_/g, ' ')}`,
      summary: session.consequence?.narrative ?? 'Decision recorded.',
      timestamp: session.decision.recordedAt,
    })
  }

  if (session.reflection?.completedAt) {
    timeline.push({
      id: 'reflection',
      kind: 'reflection',
      title: 'Reflection Complete',
      summary: session.reflection.summary,
      timestamp: session.reflection.completedAt,
    })
  }

  const reflection = session.reflection
    ? {
        summary: session.reflection.summary,
        learningHighlights: session.reflection.learningHighlights,
        advisorInsight: session.reflection.advisorInsight,
        prompts: session.reflection.prompts,
        answers: session.reflection.answers,
        completed: session.reflection.completedAt !== null,
      }
    : session.consequence
      ? {
          summary: 'Reflection pending — complete prompts to finish the cycle.',
          learningHighlights: [
            session.consequence.narrative,
            session.consequence.qualityExplanation,
          ],
          advisorInsight: decisionQualityLabel(session.consequence.decisionQuality),
          prompts: buildReflectionPrompts(),
          answers: [],
          completed: false,
        }
      : null

  const advisorReadiness = session.phase === 'cycle_complete' && session.reflection
    ? session.reflection.advisorInsight
    : null

  return {
    sessionId: session.id,
    phase: session.phase,
    timeline,
    reflection,
    advisorReadiness,
  }
}

export function projectLensView(session: SimulationSession, lens: LensId): LensView {
  switch (lens) {
    case 'life':
      return { lens: 'life', data: projectDashboard(session) }
    case 'plan':
      return { lens: 'plan', data: projectPlanLens(session) }
    case 'protect':
      return { lens: 'protect', data: projectProtectLens(session) }
    case 'grow':
      return { lens: 'grow', data: projectGrowLens(session) }
    case 'journey':
      return { lens: 'journey', data: projectJourneyLens(session) }
  }
}
