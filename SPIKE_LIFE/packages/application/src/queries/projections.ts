import type { SimulationSession } from '@spike-life/domain'
import { formatCurrency, type CurrencyConfig } from '@spike-life/content-core'
import {
  calculateLifeScore,
  buildReflectionPrompts,
  decisionQualityLabel,
  getDecisionOptions,
  getEncounterRepository,
  monthlySurplus,
  netWorth,
  totalAssets,
  totalLiabilities,
  WORKSHOP_MAX_TURNS,
  WORKSHOP_STAGE_ORDER,
  workshopStageLabel,
  getArchetypeLabel,
  getArchetypeTagline,
  formatCycleLabel,
  cycleIndexForMacroTurn,
  getCampaignConfig,
  getCalendarEvents,
  computePlayerLifeSummary,
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
  ConsequenceRevealView,
  ProtectLensView,
  RecommendationView,
  BoardStageView,
  TurnHistoryView,
  DreamBoardView,
  ThirteenthMonthAllocationView,
  AnnualCheckpointView,
  LifeSummaryView,
} from './read-models.js'
import { DEFAULT_CURRENCY } from '../content/bootstrap.js'

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

function resolveCurrency(session: SimulationSession): CurrencyConfig {
  return session.currency ?? DEFAULT_CURRENCY
}

export function formatMoney(amount: number, currency: CurrencyConfig = DEFAULT_CURRENCY): MoneyDisplay {
  return {
    amount,
    formatted: formatCurrency(amount, currency),
  }
}

/** @deprecated Use formatMoney with session currency */
export function formatPeso(amount: number): MoneyDisplay {
  return formatMoney(amount, DEFAULT_CURRENCY)
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
  const currency = resolveCurrency(session)

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
    emergencyFundTarget: formatMoney(fna.emergencyFundTarget, currency),
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

function resolveCycleIndex(session: SimulationSession): number {
  return session.cycleIndex
    ?? cycleIndexForMacroTurn(session.turnNumber ?? 1, getCampaignConfig())
}

function projectDreamBoard(session: SimulationSession): DreamBoardView | null {
  const board = session.dreamBoard
  if (!board) return null
  const currency = resolveCurrency(session)
  return {
    completed: Boolean(board.completedAt),
    emergencyFundTarget: formatMoney(board.emergencyFundTarget, currency),
    goals: board.goals.map((g) => ({
      goalId: g.goalId,
      goalName: g.goalName,
      enabled: g.enabled,
      presentValue: formatMoney(g.presentValue, currency),
      futureValue: formatMoney(g.futureValue, currency),
      targetAge: g.targetAge,
      icon: g.icon,
    })),
  }
}

export function projectLifeSummary(session: SimulationSession): LifeSummaryView {
  const player = computePlayerLifeSummary(
    session,
    getArchetypeLabel(session.character.archetypeId),
  )
  const maxTurns = session.maxTurns ?? WORKSHOP_MAX_TURNS
  const complete = session.phase === 'cycle_complete' && (session.turnNumber ?? 1) >= maxTurns
  return {
    complete,
    winnerSessionId: complete ? player.sessionId : null,
    players: [{ ...player, rank: 1 }],
  }
}

export function projectDashboard(session: SimulationSession): DashboardView {
  const fna = activeFna(session)
  const profile = session.financialProfile
  const currency = resolveCurrency(session)
  const decisionQuality = session.consequence?.decisionQuality ?? null
  const cycleIndex = resolveCycleIndex(session)
  const maxTurns = session.maxTurns ?? WORKSHOP_MAX_TURNS
  const maxCycles = session.maxCycles ?? getCampaignConfig().totalYears * getCampaignConfig().cyclesPerYear
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
    archetypeId: session.character.archetypeId,
    archetypeLabel: getArchetypeLabel(session.character.archetypeId),
    archetypeTagline: getArchetypeTagline(session.character.archetypeId),
    age: session.character.age,
    lifeStage: session.character.lifeStage,
    lifeStageLabel: LIFE_STAGE_LABELS[session.character.lifeStage] ?? session.character.lifeStage,
    simulationYear: session.simulationYear ?? 1,
    cycleIndex,
    halfYear: session.halfYear ?? 'H1',
    cycleLabel: formatCycleLabel(cycleIndex),
    maxCycles,
    turnNumber: session.turnNumber ?? 1,
    maxTurns,
    canAdvanceTurn:
      session.phase === 'cycle_complete'
      && (session.turnNumber ?? 1) < maxTurns
      && !session.pendingCalendarEvent,
    workshopComplete:
      session.phase === 'cycle_complete'
      && (session.turnNumber ?? 1) >= maxTurns,
    dreamBoardComplete: Boolean(session.dreamBoard?.completedAt),
    dreamBoard: projectDreamBoard(session),
    decisionTimerSeconds: session.decisionTimerSeconds ?? 0,
    cycleDeadlineAt: session.cycleDeadlineAt ?? null,
    pendingCalendarEvent: session.pendingCalendarEvent ?? null,
    thirteenthMonthAllocations: getCalendarEvents().thirteenthMonthAllocations.map(
      (a): ThirteenthMonthAllocationView => ({
        id: a.id,
        label: a.label,
        description: a.description,
      }),
    ),
    lastAnnualCheckpoint: session.lastAnnualCheckpoint
      ? {
          simulationYear: session.lastAnnualCheckpoint.simulationYear,
          netWorth: formatMoney(session.lastAnnualCheckpoint.netWorth, currency),
          monthlySurplus: formatMoney(session.lastAnnualCheckpoint.monthlySurplus, currency),
          emergencyFundProgress: session.lastAnnualCheckpoint.emergencyFundProgress,
          protectionScore: session.lastAnnualCheckpoint.protectionScore,
          goalProgress: session.lastAnnualCheckpoint.goalProgress,
          lifeScoreOverall: session.lastAnnualCheckpoint.lifeScoreOverall,
          advisorInsight: session.lastAnnualCheckpoint.advisorInsight,
        }
      : null,
    canStartScenario:
      session.phase === 'created'
      && Boolean(session.dreamBoard?.completedAt)
      && !session.pendingCalendarEvent,
    boardStages: projectBoardStages(session.turnNumber ?? 1),
    turnHistory: projectTurnHistory({
      ...session,
      turnHistory: session.turnHistory ?? [],
    }),
    lifeScore,
    monthlyIncome: formatMoney(profile.monthlyIncome, currency),
    monthlySurplus: formatMoney(monthlySurplus(profile), currency),
    liquidCash: formatMoney(profile.cash, currency),
    netWorth: formatMoney(netWorth(profile), currency),
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

export function projectConsequenceReveal(session: SimulationSession): ConsequenceRevealView | null {
  if (!session.consequence || !session.fnaBeforeDecision || !session.fnaAfterDecision) {
    return null
  }
  const currency = resolveCurrency(session)
  const beforeFna = session.fnaBeforeDecision
  const afterFna = session.fnaAfterDecision
  const consequence = session.consequence
  const beforeScore = calculateLifeScore(
    beforeFna,
    session.financialProfile,
    null,
  )
  const afterProfile = session.financialProfile
  const afterScore = calculateLifeScore(
    afterFna,
    afterProfile,
    session.consequence.decisionQuality,
  )

  const houseGoal = session.goalPortfolio.goals.find((g) =>
    /home|house/i.test(g.goalName),
  )

  const deltas = [
    {
      label: 'Savings readiness',
      before: Math.round(beforeFna.emergencyFundProgress * 100),
      after: Math.round(afterFna.emergencyFundProgress * 100),
      unit: '%',
      higherIsBetter: true,
    },
    {
      label: 'Protection',
      before: beforeFna.protectionScore,
      after: afterFna.protectionScore,
      higherIsBetter: true,
    },
    {
      label: 'Life Score',
      before: beforeScore.overall,
      after: afterScore.overall,
      higherIsBetter: true,
    },
  ]

  if (houseGoal) {
    deltas.push({
      label: `${houseGoal.goalName} target age`,
      before: houseGoal.targetAge,
      after: houseGoal.targetAge + (afterScore.overall < beforeScore.overall ? 2 : 0),
      higherIsBetter: false,
    })
  }

  const domainLabel = session.selectedDomainId?.replace(/_/g, ' ') ?? 'Life'
  const headlineTitle = `${domainLabel} cycle adjustment`
  const encounterId = session.encounterId ?? null
  const decisionOption = getDecisionOptions(session.scenarioId, encounterId).find(
    (opt) => opt.strategy === session.decision?.strategy,
  )
  const decisionSubtitle = decisionOption?.label ?? consequence.narrative

  const cashFlowDelta = -consequence.expensesDelta
  const protectionDelta = afterFna.protectionScore - beforeFna.protectionScore
  const riskBefore = Math.max(0, 100 - beforeFna.protectionScore)
  const riskAfter = Math.max(0, 100 - afterFna.protectionScore)
  const riskDelta = riskAfter - riskBefore
  const lifeDelta = afterScore.overall - beforeScore.overall

  const signedMoney = (amount: number, suffix = '') => {
    const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
    return `${sign}${formatMoney(Math.abs(amount), currency).formatted}${suffix}`
  }

  const signedPercent = (amount: number) => {
    const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
    return `${sign}${Math.abs(amount)}%`
  }

  const signedPoints = (amount: number) => {
    const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
    return `${sign}${Math.abs(amount)}`
  }

  const rows = [
    {
      label: 'Cash flow',
      displayValue: signedMoney(cashFlowDelta, ' /mo'),
      improved: cashFlowDelta >= 0,
    },
    {
      label: 'Cash buffer',
      displayValue: signedMoney(consequence.cashDelta),
      improved: consequence.cashDelta >= 0,
    },
    {
      label: 'Protection',
      displayValue: signedPercent(protectionDelta),
      improved: protectionDelta >= 0,
    },
    {
      label: 'Risk exposure',
      displayValue: signedPercent(riskDelta),
      improved: riskDelta <= 0,
    },
    {
      label: 'Life score',
      displayValue: signedPoints(lifeDelta),
      improved: lifeDelta >= 0,
    },
  ]

  return {
    narrative: session.consequence.narrative,
    qualityLabel: decisionQualityLabel(session.consequence.decisionQuality),
    headlineTitle,
    decisionSubtitle,
    rows,
    deltas,
    lifeScoreBefore: beforeScore.overall,
    lifeScoreAfter: afterScore.overall,
  }
}

export function projectPlanLens(session: SimulationSession): PlanLensView {
  const currency = resolveCurrency(session)
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
    targetAmount: formatMoney(goal.targetAmount, currency),
    currentFunding: formatMoney(goal.currentFunding, currency),
    progressPercent: goal.targetAmount > 0
      ? Math.round(Math.min(100, (goal.currentFunding / goal.targetAmount) * 100))
      : 0,
    targetAge: goal.targetAge,
    status: goal.status,
  }))

  const encounterId = session.encounterId ?? null
  let situation: PlanLensView['situation'] = null
  if (encounterId) {
    try {
      const enc = getEncounterRepository().getById(encounterId)
      if (enc) {
        situation = {
          title: enc.title,
          narrative: enc.narrative || enc.teaser,
          domainLabel: enc.domainId.replace(/_/g, ' '),
          learningObjective: enc.learningObjective,
        }
      }
    } catch {
      situation = session.situation
        ? {
            title: session.situation.title,
            narrative: session.situation.narrative,
            domainLabel: session.selectedDomainId?.replace(/_/g, ' ') ?? 'Life',
            learningObjective: session.situation.learningObjective,
          }
        : null
    }
  } else if (session.situation) {
    situation = {
      title: session.situation.title,
      narrative: session.situation.narrative,
      domainLabel: session.selectedDomainId?.replace(/_/g, ' ') ?? 'Life',
      learningObjective: session.situation.learningObjective,
    }
  }

  return {
    sessionId: session.id,
    phase: session.phase,
    cycleLabel: formatCycleLabel(resolveCycleIndex(session)),
    cycleDeadlineAt: session.cycleDeadlineAt ?? null,
    decisionTimerSeconds: session.decisionTimerSeconds ?? 0,
    situation,
    fna: projectFnaSummary(session),
    recommendations,
    goals,
    decisionOptions: getDecisionOptions(session.scenarioId, encounterId).map((opt) => ({
      strategy: opt.strategy,
      label: opt.label,
      description: opt.description,
      alignsWithSolutions: opt.alignsWithSolutions,
      costLabel: opt.costLabel,
      outcomePreview: opt.outcomePreview,
      tone: opt.tone,
    })),
    canDecide: session.phase === 'decision_pending',
    selectedStrategy: session.decision?.strategy ?? null,
    decisionQuality: session.consequence
      ? decisionQualityLabel(session.consequence.decisionQuality)
      : null,
    consequenceReveal: projectConsequenceReveal(session),
  }
}

export function projectProtectLens(session: SimulationSession): ProtectLensView {
  const fna = activeFna(session)
  const protection = session.protectionPortfolio
  const profile = session.financialProfile
  const currency = resolveCurrency(session)

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
        ? `Gap of ${formatMoney(fna.familyProtectionGap, currency).formatted} against need.`
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
    familyProtectionGap: formatMoney(fna?.familyProtectionGap ?? 0, currency),
    healthProtectionNeed: formatMoney(fna?.healthProtectionNeed ?? 0, currency),
  }
}

export function projectGrowLens(session: SimulationSession): GrowLensView {
  const profile = session.financialProfile
  const currency = resolveCurrency(session)
  const income = profile.monthlyIncome
  const debtRatio = income > 0
    ? Math.round((profile.monthlyDebtPayments / income) * 100)
    : 0

  return {
    sessionId: session.id,
    phase: session.phase,
    cashFlow: {
      monthlyIncome: formatMoney(profile.monthlyIncome, currency),
      monthlyExpenses: formatMoney(profile.monthlyExpenses, currency),
      monthlySurplus: formatMoney(monthlySurplus(profile), currency),
      debtRatioPercent: debtRatio,
    },
    assets: {
      cash: formatMoney(profile.cash, currency),
      investments: formatMoney(profile.investments, currency),
      property: formatMoney(profile.propertyValue, currency),
      business: formatMoney(profile.businessValue, currency),
      total: formatMoney(totalAssets(profile), currency),
    },
    liabilities: {
      creditCard: formatMoney(profile.creditCardDebt, currency),
      personalLoan: formatMoney(profile.personalLoan, currency),
      housingLoan: formatMoney(profile.housingLoan, currency),
      businessLoan: formatMoney(profile.businessLoan, currency),
      total: formatMoney(totalLiabilities(profile), currency),
    },
    netWorth: formatMoney(netWorth(profile), currency),
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
