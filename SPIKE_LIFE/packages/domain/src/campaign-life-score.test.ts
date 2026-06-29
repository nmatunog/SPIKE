import { describe, expect, it } from 'vitest'
import type { SimulationState } from './aggregates/simulation-session.js'
import { computeCampaignLifeSummary } from './services/campaign-life-score.js'
import { calculateLifeScore } from './services/life-score-engine.js'
import { runFnaAnalysis } from './services/fna-engine.js'
import { FRESH_GRADUATE_CHARACTER } from './specifications/fresh-graduate.js'

function completeSession(
  id: string,
  profileOverrides: Partial<SimulationState['financialProfile']>,
  protection: SimulationState['protectionPortfolio'],
  goals: SimulationState['goalPortfolio'],
): SimulationState {
  return {
    id,
    phase: 'cycle_complete',
    turnNumber: 20,
    maxTurns: 20,
    cycleIndex: 20,
    maxCycles: 20,
    sessionMode: 'campaign',
    character: { ...FRESH_GRADUATE_CHARACTER, name: id },
    financialProfile: {
      cash: 500_000,
      investments: 200_000,
      propertyValue: 0,
      businessValue: 0,
      creditCardDebt: 0,
      personalLoan: 0,
      housingLoan: 0,
      businessLoan: 0,
      monthlyIncome: 80_000,
      monthlyExpenses: 50_000,
      monthlyDebtPayments: 0,
      monthlyProtectionCost: 0,
      ...profileOverrides,
    },
    protectionPortfolio: protection,
    goalPortfolio: goals,
    dreamBoard: null,
    turnHistory: [],
    updatedAt: new Date().toISOString(),
  } as unknown as SimulationState
}

describe('computeCampaignLifeSummary', () => {
  it('richest player does not automatically win — balanced life wins', () => {
    const wealthy = completeSession(
      'wealthy',
      {
        cash: 3_000_000,
        investments: 2_000_000,
        propertyValue: 5_000_000,
        housingLoan: 4_000_000,
        monthlyIncome: 120_000,
        monthlyExpenses: 90_000,
        monthlyDebtPayments: 35_000,
      },
      {
        lifeCover: 0,
        medicalCover: 0,
        incomeProtectionCover: 0,
        criticalIllnessCover: 0,
        accidentCover: 0,
      },
      { goals: [] },
    )

    const balanced = completeSession(
      'balanced',
      {
        cash: 800_000,
        investments: 400_000,
        monthlyIncome: 70_000,
        monthlyExpenses: 45_000,
      },
      {
        lifeCover: 2_000_000,
        medicalCover: 1_000_000,
        incomeProtectionCover: 500_000,
        criticalIllnessCover: 500_000,
        accidentCover: 200_000,
      },
      {
        goals: [
          {
            goalId: 'ef',
            goalName: 'Emergency Fund',
            targetAmount: 300_000,
            currentFunding: 300_000,
            targetAge: 30,
            status: 'completed',
          },
        ],
      },
    )

    const wealthyFna = runFnaAnalysis(
      wealthy.character,
      wealthy.financialProfile,
      wealthy.protectionPortfolio,
      wealthy.goalPortfolio,
    )
    const balancedFna = runFnaAnalysis(
      balanced.character,
      balanced.financialProfile,
      balanced.protectionPortfolio,
      balanced.goalPortfolio,
    )

    wealthy.fnaAfterDecision = wealthyFna
    balanced.fnaAfterDecision = balancedFna

    const wealthyScore = calculateLifeScore(wealthyFna, wealthy.financialProfile, 'needs_attention')
    const balancedScore = calculateLifeScore(balancedFna, balanced.financialProfile, 'good')

    expect(wealthyScore.wealth).toBeGreaterThan(balancedScore.wealth)
    expect(balancedScore.overall).toBeGreaterThan(wealthyScore.overall)

    const summary = computeCampaignLifeSummary(
      [wealthy, balanced],
      { fresh_graduate: 'Fresh Graduate' },
    )

    expect(summary.complete).toBe(true)
    expect(summary.winnerSessionId).toBe('balanced')
    expect(summary.players[0]!.sessionId).toBe('balanced')
  })
})
