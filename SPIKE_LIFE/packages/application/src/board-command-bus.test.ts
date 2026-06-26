import { describe, expect, it } from 'vitest'
import { InMemoryBoardRepository, InMemorySimulationRepository } from '@spike-life/infrastructure'
import { BoardCommandBus } from './board-command-bus.js'
import { BoardQueryBus } from './board-query-bus.js'

describe('BoardCommandBus', () => {
  it('rolls dice, triggers a situation, and exposes spatial board view', async () => {
    const boardRepo = new InMemoryBoardRepository()
    const simulationRepo = new InMemorySimulationRepository()
    const commands = new BoardCommandBus(boardRepo, simulationRepo)
    const queries = new BoardQueryBus(boardRepo)

    await commands.ensureSoloBoard('board-test', 'sim-test', 'Alex')
    const roll = await commands.rollDice('board-test')

    expect(roll.encounterTitle).toBeTruthy()
    expect(roll.scenarioId).toMatch(/promotion|protection_stress/)

    const view = await queries.getSpatialBoard('board-test')
    expect(view?.phase).toBe('decision_phase')
    expect(view?.activeEncounter?.title).toBe(roll.encounterTitle)
    expect(view?.spaces.length).toBeGreaterThan(0)
    expect(view?.canRoll).toBe(false)
  })
})
