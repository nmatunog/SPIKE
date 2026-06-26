import { describe, expect, it } from 'vitest'
import {
  FinancialDecisionCommandBus,
} from './command-bus.js'
import { FinancialDecisionQueryBus } from './query-bus.js'
import { InMemorySimulationRepository } from '@spike-life/infrastructure'

const REFLECTION = [
  { promptId: 'a', response: 'Outcome improved savings.' },
  { promptId: 'b', response: 'FNA guided the choice.' },
  { promptId: 'c', response: 'Would protect income earlier.' },
]

describe('CQRS command bus — Promotion cycle', () => {
  it('runs start → decision → reflection via repository', async () => {
    const repo = new InMemorySimulationRepository()
    const commands = new FinancialDecisionCommandBus(repo)
    const queries = new FinancialDecisionQueryBus(repo)

    const { sessionId, phase } = await commands.startPromotionCycle('cqrs-1')
    expect(phase).toBe('decision_pending')

    const afterDecision = await commands.submitPromotionDecision(
      sessionId,
      'maintain_lifestyle_discipline',
    )
    expect(afterDecision.phase).toBe('consequences_applied')

    const complete = await commands.submitPromotionReflection(sessionId, REFLECTION)
    expect(complete.phase).toBe('cycle_complete')

    const loaded = await queries.getSession(sessionId)
    expect(loaded?.reflection?.completedAt).not.toBeNull()
  })
})
