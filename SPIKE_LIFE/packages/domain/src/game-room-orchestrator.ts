import type { CurrencyConfig } from '@spike-life/content-core'
import type { DecisionStrategy, SessionMode } from './types.js'
import type { DecisionTimerPreset } from '@spike-life/content-core'
import type { ReflectionAnswer } from './services/reflection-engine.js'
import type { SimulationState } from './aggregates/simulation-session.js'
import type { GameRoomState } from './aggregates/game-room.js'
import { GameRoom, simulationIdForPlayer } from './aggregates/game-room.js'
import type { GameRoomRepository } from './ports/game-room-repository.js'
import type { SimulationRepository } from './ports/simulation-repository.js'
import {
  advanceTurn,
  applyAutoAdvisorDecision,
  beginDecisionWindow,
  createWorkshopSession,
  dismissCalendarEvent,
  resolveThirteenthMonthPay,
  setDreamBoard,
  startPlanningCycle,
  startRoomCycle as startPlayerCycle,
  submitDecision,
  submitReflection,
} from './financial-decision-engine.js'
import { pickRandomArchetypeId } from './services/archetype-selection.js'
import { generateGameCode } from './services/game-room-utils.js'
import { timerSecondsFromPreset } from './services/planning-cycle.js'

export interface GameRoomOrchestratorDeps {
  gameRoomRepo: GameRoomRepository
  simulationRepo: SimulationRepository
}

export interface CreateRoomOptions {
  maxPlayers?: number
  sessionMode?: SessionMode
  decisionTimerPreset?: DecisionTimerPreset
  gameCode?: string
}

export function createGameRoom(
  deps: GameRoomOrchestratorDeps,
  roomId: string,
  options?: CreateRoomOptions,
): Promise<GameRoomState> {
  const room = GameRoom.create(roomId, options?.gameCode ?? generateGameCode(), {
    maxPlayers: options?.maxPlayers,
    sessionMode: options?.sessionMode,
    decisionTimerPreset: options?.decisionTimerPreset,
  })
  return deps.gameRoomRepo.save(room.toState()).then(() => room.toState())
}

export async function configureGameRoomLobby(
  deps: GameRoomOrchestratorDeps,
  roomId: string,
  options: {
    sessionMode?: SessionMode
    decisionTimerPreset?: DecisionTimerPreset
  },
): Promise<GameRoomState> {
  const existing = await deps.gameRoomRepo.findById(roomId)
  if (!existing) throw new Error(`Room not found: ${roomId}`)

  const room = GameRoom.fromState(existing).configureLobby(options)
  await deps.gameRoomRepo.save(room.toState())
  return room.toState()
}

export async function joinGameRoom(
  deps: GameRoomOrchestratorDeps,
  roomId: string,
  playerId: string,
  displayName: string,
  currency: CurrencyConfig,
): Promise<GameRoomState> {
  const existing = await deps.gameRoomRepo.findById(roomId)
  if (!existing) throw new Error(`Room not found: ${roomId}`)

  const usedArchetypeIds = existing.slots.map((slot) => slot.archetypeId)
  const archetypeId = pickRandomArchetypeId(usedArchetypeIds)

  const simulationId = simulationIdForPlayer(roomId, playerId)
  let workshop = createWorkshopSession(
    simulationId,
    currency,
    archetypeId,
    existing.sessionMode,
  )
  workshop = {
    ...workshop,
    decisionTimerSeconds: timerSecondsFromPreset(existing.decisionTimerPreset),
  }
  if (workshop.dreamBoard?.goals?.length) {
    // Players complete Life Blueprint in the setup phase — do not auto-submit.
  }

  const room = GameRoom.fromState(existing).join(
    playerId,
    displayName,
    simulationId,
    archetypeId,
  )
  await deps.gameRoomRepo.save(room.toState())
  await deps.simulationRepo.save(workshop)
  return room.toState()
}

export async function submitPlayerDreamBoard(
  deps: GameRoomOrchestratorDeps,
  roomId: string,
  playerId: string,
  goalChoices: import('./services/dream-board.js').DreamBoardGoalChoice[],
): Promise<SimulationState> {
  const roomState = await deps.gameRoomRepo.findById(roomId)
  if (!roomState) throw new Error(`Room not found: ${roomId}`)

  const slot = roomState.slots.find((s) => s.playerId === playerId)
  if (!slot) throw new Error(`Player not in room: ${playerId}`)

  const sim = await deps.simulationRepo.findById(slot.simulationId)
  if (!sim) throw new Error(`Simulation not found: ${slot.simulationId}`)

  const updated = setDreamBoard(sim, goalChoices)
  await deps.simulationRepo.save(updated)

  const room = GameRoom.fromState(roomState).markPlayerReady(playerId)
  await deps.gameRoomRepo.save(room.toState())

  return updated
}

export async function startRoomCycle(
  deps: GameRoomOrchestratorDeps,
  roomId: string,
): Promise<GameRoomState> {
  const existing = await deps.gameRoomRepo.findById(roomId)
  if (!existing) throw new Error(`Room not found: ${roomId}`)

  let room = GameRoom.fromState(existing)
  if (!room.canStartCycle()) {
    if (!room.allPlayersReady()) {
      throw new Error('Every player must finish Life Blueprint setup before starting.')
    }
    throw new Error('Cannot start cycle yet — check player count and room phase.')
  }
  room = room.startCycle()

  for (const slot of room.activeSlots) {
    const sim = await deps.simulationRepo.findById(slot.simulationId)
    const started = startPlayerCycle(slot.simulationId, sim)
    await deps.simulationRepo.save(started)
    room = room.syncSlotFromSimulationPhase(slot.playerId, started.phase)
  }

  await deps.gameRoomRepo.save(room.toState())
  return room.toState()
}

/** @deprecated Use startRoomCycle — scenario is domain-driven. */
export async function startRoomTurn(
  deps: GameRoomOrchestratorDeps,
  roomId: string,
  _scenarioId?: string,
): Promise<GameRoomState> {
  return startRoomCycle(deps, roomId)
}

export async function beginPlayerDecisionWindow(
  deps: GameRoomOrchestratorDeps,
  roomId: string,
  playerId: string,
): Promise<SimulationState> {
  const roomState = await deps.gameRoomRepo.findById(roomId)
  if (!roomState) throw new Error(`Room not found: ${roomId}`)

  const slot = roomState.slots.find((s) => s.playerId === playerId)
  if (!slot) throw new Error(`Player not in room: ${playerId}`)

  const sim = await deps.simulationRepo.findById(slot.simulationId)
  if (!sim) throw new Error(`Simulation not found: ${slot.simulationId}`)

  const updated = beginDecisionWindow(sim)
  await deps.simulationRepo.save(updated)
  return updated
}

export async function submitPlayerAutoAdvisor(
  deps: GameRoomOrchestratorDeps,
  roomId: string,
  playerId: string,
): Promise<SimulationState> {
  const roomState = await deps.gameRoomRepo.findById(roomId)
  if (!roomState) throw new Error(`Room not found: ${roomId}`)

  const slot = roomState.slots.find((s) => s.playerId === playerId)
  if (!slot) throw new Error(`Player not in room: ${playerId}`)

  const sim = await deps.simulationRepo.findById(slot.simulationId)
  if (!sim) throw new Error(`Simulation not found: ${slot.simulationId}`)

  const updated = applyAutoAdvisorDecision(sim)
  await deps.simulationRepo.save(updated)

  const room = GameRoom.fromState(roomState)
    .syncSlotFromSimulationPhase(playerId, updated.phase)
  await deps.gameRoomRepo.save(room.toState())

  return updated
}

export async function submitPlayerCalendarChoice(
  deps: GameRoomOrchestratorDeps,
  roomId: string,
  playerId: string,
  allocationId: string,
): Promise<SimulationState> {
  const roomState = await deps.gameRoomRepo.findById(roomId)
  if (!roomState) throw new Error(`Room not found: ${roomId}`)

  const slot = roomState.slots.find((s) => s.playerId === playerId)
  if (!slot) throw new Error(`Player not in room: ${playerId}`)

  const sim = await deps.simulationRepo.findById(slot.simulationId)
  if (!sim) throw new Error(`Simulation not found: ${slot.simulationId}`)

  let updated = resolveThirteenthMonthPay(sim, allocationId)
  if (updated.pendingCalendarEvent === 'annual_checkpoint') {
    updated = dismissCalendarEvent(updated)
  }
  await deps.simulationRepo.save(updated)

  const anyPending = await Promise.all(
    roomState.slots.map(async (s) => {
      const state = s.playerId === playerId
        ? updated
        : await deps.simulationRepo.findById(s.simulationId)
      return state?.pendingCalendarEvent ?? null
    }),
  )
  let room = GameRoom.fromState(roomState)
  if (anyPending.some(Boolean)) {
    room = GameRoom.fromState({ ...room.toState(), roomPhase: 'awaiting_calendar' })
  }
  await deps.gameRoomRepo.save(room.toState())

  return updated
}

export async function submitPlayerDecision(
  deps: GameRoomOrchestratorDeps,
  roomId: string,
  playerId: string,
  strategy: DecisionStrategy,
  rationale?: string,
): Promise<SimulationState> {
  const roomState = await deps.gameRoomRepo.findById(roomId)
  if (!roomState) throw new Error(`Room not found: ${roomId}`)

  const slot = roomState.slots.find((s) => s.playerId === playerId)
  if (!slot) throw new Error(`Player not in room: ${playerId}`)

  const sim = await deps.simulationRepo.findById(slot.simulationId)
  if (!sim) throw new Error(`Simulation not found: ${slot.simulationId}`)

  const updated = submitDecision(sim, strategy, rationale)
  await deps.simulationRepo.save(updated)

  const room = GameRoom.fromState(roomState)
    .syncSlotFromSimulationPhase(playerId, updated.phase)
  await deps.gameRoomRepo.save(room.toState())

  return updated
}

export async function submitPlayerReflection(
  deps: GameRoomOrchestratorDeps,
  roomId: string,
  playerId: string,
  answers: ReflectionAnswer[],
): Promise<SimulationState> {
  const roomState = await deps.gameRoomRepo.findById(roomId)
  if (!roomState) throw new Error(`Room not found: ${roomId}`)

  const slot = roomState.slots.find((s) => s.playerId === playerId)
  if (!slot) throw new Error(`Player not in room: ${playerId}`)

  const sim = await deps.simulationRepo.findById(slot.simulationId)
  if (!sim) throw new Error(`Simulation not found: ${slot.simulationId}`)

  const updated = submitReflection(sim, answers)
  await deps.simulationRepo.save(updated)

  const room = GameRoom.fromState(roomState)
    .syncSlotFromSimulationPhase(playerId, updated.phase)
  await deps.gameRoomRepo.save(room.toState())

  return updated
}

export async function advanceRoomTurn(
  deps: GameRoomOrchestratorDeps,
  roomId: string,
): Promise<GameRoomState> {
  const existing = await deps.gameRoomRepo.findById(roomId)
  if (!existing) throw new Error(`Room not found: ${roomId}`)

  const roomBefore = GameRoom.fromState(existing)
  if (!roomBefore.allPlayersDone()) {
    throw new Error('All players must complete reflection before advancing.')
  }

  for (const slot of roomBefore.activeSlots) {
    const sim = await deps.simulationRepo.findById(slot.simulationId)
    if (!sim) throw new Error(`Simulation not found: ${slot.simulationId}`)
    if (sim.pendingCalendarEvent) {
      throw new Error('All players must resolve calendar events before advancing.')
    }
    const advanced = advanceTurn(sim)
    await deps.simulationRepo.save(advanced)
  }

  const room = roomBefore.advanceTurn()
  await deps.gameRoomRepo.save(room.toState())
  return room.toState()
}

export async function getGameRoom(
  deps: GameRoomOrchestratorDeps,
  roomId: string,
): Promise<GameRoomState | null> {
  return deps.gameRoomRepo.findById(roomId)
}

export { generateGameCode } from './services/game-room-utils.js'
