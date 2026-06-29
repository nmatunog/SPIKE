import type { CurrencyConfig } from '@spike-life/content-core'
import type { DecisionStrategy, ScenarioId } from './types.js'
import type { ReflectionAnswer } from './services/reflection-engine.js'
import type { SimulationState } from './aggregates/simulation-session.js'
import type { GameRoomState } from './aggregates/game-room.js'
import { GameRoom, simulationIdForPlayer } from './aggregates/game-room.js'
import type { GameRoomRepository } from './ports/game-room-repository.js'
import type { SimulationRepository } from './ports/simulation-repository.js'
import {
  advanceTurn,
  createWorkshopSession,
  setDreamBoard,
  startPlanningCycle,
  submitDecision,
  submitReflection,
} from './financial-decision-engine.js'
import { pickRandomArchetypeId } from './services/archetype-selection.js'

export interface GameRoomOrchestratorDeps {
  gameRoomRepo: GameRoomRepository
  simulationRepo: SimulationRepository
}

export function createGameRoom(
  deps: GameRoomOrchestratorDeps,
  roomId: string,
  facilitatorId: string,
): Promise<GameRoomState> {
  const room = GameRoom.create(roomId, facilitatorId)
  return deps.gameRoomRepo.save(room.toState()).then(() => room.toState())
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
  let workshop = createWorkshopSession(simulationId, currency, archetypeId)
  if (workshop.dreamBoard?.goals?.length) {
    workshop = setDreamBoard(workshop, workshop.dreamBoard.goals)
  }
  await deps.simulationRepo.save(workshop)

  const room = GameRoom.fromState(existing).join(
    playerId,
    displayName,
    simulationId,
    archetypeId,
  )
  await deps.gameRoomRepo.save(room.toState())
  return room.toState()
}

export async function startRoomTurn(
  deps: GameRoomOrchestratorDeps,
  roomId: string,
  scenarioId: ScenarioId,
): Promise<GameRoomState> {
  const existing = await deps.gameRoomRepo.findById(roomId)
  if (!existing) throw new Error(`Room not found: ${roomId}`)

  let room = GameRoom.fromState(existing).startTurn(scenarioId)

  for (const slot of room.activeSlots) {
    const sim = await deps.simulationRepo.findById(slot.simulationId)
    const started = startPlanningCycle(slot.simulationId, scenarioId, sim)
    await deps.simulationRepo.save(started)
    room = room.syncSlotFromSimulationPhase(slot.playerId, started.phase)
  }

  await deps.gameRoomRepo.save(room.toState())
  return room.toState()
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
