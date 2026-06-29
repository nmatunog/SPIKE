import type { SimulationState, TurnRecord } from '../aggregates/simulation-session.js'
import { calculateLifeScore } from './life-score-engine.js'

export interface LifeScoreDimensionSummary {
  key: string
  label: string
  score: number
}

export interface PlayerLifeSummary {
  sessionId: string
  characterName: string
  archetypeLabel: string
  age: number
  overall: number
  rating: string
  dimensions: LifeScoreDimensionSummary[]
  goalsCompleted: number
  goalsTotal: number
  turnsPlayed: number
  advisorClosing: string
}

export interface CampaignLifeSummary {
  complete: boolean
  winnerSessionId: string | null
  players: PlayerLifeSummary[]
}

const CLOSING_INSIGHTS = [
  'Balanced lives beat wealthy-but-fragile ones.',
  'Protection readiness separated the most prepared players.',
  'Goal progress rewarded patience over impulse.',
]

export function computePlayerLifeSummary(
  session: SimulationState,
  archetypeLabel: string,
): PlayerLifeSummary {
  const fna = session.fnaAfterDecision ?? session.fnaBeforeDecision
  const profile = session.financialProfile
  const quality = session.consequence?.decisionQuality ?? null
  const lifeScore = fna
    ? calculateLifeScore(fna, profile, quality)
    : {
        cashFlow: 0,
        protection: 0,
        goals: 0,
        wealth: 0,
        retirement: 0,
        impact: 70,
        overall: 0,
        rating: 'Not assessed',
      }

  const goals = session.goalPortfolio.goals
  const goalsCompleted = goals.filter(
    (g) => g.status === 'completed' || g.currentFunding >= g.targetAmount,
  ).length

  const turnsPlayed = session.turnHistory.length
    + (session.phase === 'cycle_complete' ? 1 : 0)

  return {
    sessionId: session.id,
    characterName: session.character.name,
    archetypeLabel,
    age: session.character.age,
    overall: lifeScore.overall,
    rating: lifeScore.rating,
    dimensions: [
      { key: 'cashFlow', label: 'Financial Security', score: lifeScore.cashFlow },
      { key: 'protection', label: 'Protection Readiness', score: lifeScore.protection },
      { key: 'goals', label: 'Goal Achievement', score: lifeScore.goals },
      { key: 'wealth', label: 'Wealth Creation', score: lifeScore.wealth },
      { key: 'retirement', label: 'Life Stability', score: lifeScore.retirement },
    ],
    goalsCompleted,
    goalsTotal: goals.length,
    turnsPlayed,
    advisorClosing: CLOSING_INSIGHTS[turnsPlayed % CLOSING_INSIGHTS.length]!,
  }
}

export function computeCampaignLifeSummary(
  sessions: SimulationState[],
  archetypeLabels: Record<string, string>,
): CampaignLifeSummary {
  const players = sessions.map((s) =>
    computePlayerLifeSummary(s, archetypeLabels[s.character.archetypeId] ?? s.character.archetypeId),
  )
  const sorted = [...players].sort((a, b) => b.overall - a.overall)
  const winner = sorted[0] ?? null
  const allComplete = sessions.every(
    (s) => s.phase === 'cycle_complete' && s.turnNumber >= s.maxTurns,
  )

  return {
    complete: allComplete,
    winnerSessionId: winner?.sessionId ?? null,
    players: sorted,
  }
}

export function averageLifeScoreFromHistory(history: TurnRecord[]): number | null {
  const scores = history
    .map((t) => t.lifeScoreOverall)
    .filter((s): s is number => s != null)
  if (!scores.length) return null
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}
