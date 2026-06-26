import type { GameRoomState, SimulationState } from '@spike-life/domain'
import {
  WORKSHOP_STAGE_ORDER,
  calculateLifeScore,
  workshopStageLabel,
} from '@spike-life/domain'
import type {
  GameBoardView,
  PlayerTokenView,
} from './game-room-read-models.js'
import type { BoardStageView } from './read-models.js'

const SCENARIO_LABELS: Record<string, string> = {
  promotion: 'Promotion',
  protection_stress: 'Family Health Concern',
}

const STATUS_LABELS: Record<string, string> = {
  joined: 'Ready',
  planning: 'Planning',
  decided: 'Decided',
  reflected: 'Reflecting',
  done: 'Done',
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

function lifeScoreForSimulation(session: SimulationState | null): number | null {
  if (!session) return null
  const fna = session.fnaAfterDecision ?? session.fnaBeforeDecision
  if (!fna) return null
  const score = calculateLifeScore(
    fna,
    session.financialProfile,
    session.consequence?.decisionQuality ?? null,
  )
  return score.overall
}

function projectPlayerToken(
  room: GameRoomState,
  slot: GameRoomState['slots'][number],
  simulation: SimulationState | null,
): PlayerTokenView {
  return {
    slotIndex: slot.slotIndex,
    playerId: slot.playerId,
    displayName: slot.displayName,
    tokenColor: slot.tokenColor,
    status: slot.status,
    statusLabel: STATUS_LABELS[slot.status] ?? slot.status,
    simulationId: slot.simulationId,
    lifeScoreOverall: lifeScoreForSimulation(simulation),
    characterName: simulation?.character.name ?? null,
  }
}

export function projectGameBoard(
  room: GameRoomState,
  simulations: Map<string, SimulationState>,
): GameBoardView {
  const players = room.slots.map((slot) =>
    projectPlayerToken(room, slot, simulations.get(slot.simulationId) ?? null),
  )

  const done = room.slots.filter((s) => s.status === 'done').length
  const planning = room.slots.filter((s) => s.status === 'planning').length
  const decided = room.slots.filter(
    (s) => s.status === 'decided' || s.status === 'reflected',
  ).length

  const allPlayersDone =
    room.slots.length > 0 && room.slots.every((s) => s.status === 'done')

  const canAdvanceTurn =
    room.roomPhase === 'turn_active'
    && allPlayersDone
    && room.turnNumber < room.maxTurns

  const workshopComplete =
    room.roomPhase === 'workshop_complete'
    || (room.roomPhase === 'turn_active'
      && allPlayersDone
      && room.turnNumber >= room.maxTurns)

  return {
    roomId: room.id,
    facilitatorId: room.facilitatorId,
    roomPhase: room.roomPhase,
    turnNumber: room.turnNumber,
    maxTurns: room.maxTurns,
    lifeStage: room.lifeStage,
    lifeStageLabel: workshopStageLabel(room.lifeStage),
    sharedScenarioId: room.sharedScenarioId,
    sharedScenarioLabel: room.sharedScenarioId
      ? SCENARIO_LABELS[room.sharedScenarioId] ?? room.sharedScenarioId
      : null,
    joinOpen: room.joinOpen,
    playerCount: room.slots.length,
    maxPlayers: room.maxPlayers,
    slotsOpen: room.maxPlayers - room.slots.length,
    boardStages: projectBoardStages(room.turnNumber),
    players,
    allPlayersDone,
    canAdvanceTurn,
    workshopComplete,
    completionSummary: {
      done,
      planning,
      decided,
      total: room.slots.length,
    },
  }
}
