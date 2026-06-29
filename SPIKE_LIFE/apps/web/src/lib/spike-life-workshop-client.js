import {
  InMemoryGameRoomRepository,
  InMemorySimulationRepository,
} from '@spike-life/infrastructure'
import {
  FinancialDecisionQueryBus,
  GameRoomCommandBus,
  GameRoomQueryBus,
  GAME_ROOM_MAX_PLAYERS,
  GAME_ROOM_MIN_PLAYERS,
} from '@spike-life/application'
import {
  computeCampaignLifeSummary,
  dismissCalendarEvent,
  GameRoom,
  getArchetypeLabel,
} from '@spike-life/domain'

export { GAME_ROOM_MAX_PLAYERS, GAME_ROOM_MIN_PLAYERS }

let gameRoomRepo = new InMemoryGameRoomRepository()
let simulationRepo = new InMemorySimulationRepository()
let roomCommands = new GameRoomCommandBus(gameRoomRepo, simulationRepo)
let roomQueries = new GameRoomQueryBus(gameRoomRepo, simulationRepo)
let playerQueries = new FinancialDecisionQueryBus(simulationRepo)

let activeRoomId = null

function requireRoomId() {
  if (!activeRoomId) {
    throw new Error('No active game. Create or join a game first.')
  }
  return activeRoomId
}

async function syncRoomCalendarPhase(roomState, playerId, updatedSim) {
  const anyPending = await Promise.all(
    roomState.slots.map(async (slot) => {
      const state = slot.playerId === playerId
        ? updatedSim
        : await simulationRepo.findById(slot.simulationId)
      return state?.pendingCalendarEvent ?? null
    }),
  )

  let room = GameRoom.fromState(roomState)
  if (anyPending.some(Boolean)) {
    room = GameRoom.fromState({ ...room.toState(), roomPhase: 'awaiting_calendar' })
  } else if (roomState.roomPhase === 'awaiting_calendar') {
    room = GameRoom.fromState({ ...room.toState(), roomPhase: 'cycle_active' })
  }
  await gameRoomRepo.save(room.toState())
}

export function setActiveRoom(roomId) {
  activeRoomId = roomId
}

export function getActiveRoomId() {
  return activeRoomId
}

export function normalizeGameCode(code) {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

export function roomIdFromGameCode(code) {
  return `game-${normalizeGameCode(code)}`
}

export function generateGameCode() {
  const segment = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `LIFE-${segment}`
}

export function slugifyPlayerId(name) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || `player-${Date.now()}`
}

export async function createGame(facilitatorName = 'Facilitator', options = {}) {
  const {
    sessionMode = 'workshop_compressed',
    decisionTimerPreset = '10',
    gameCode: preferredCode,
  } = options

  let gameCode = preferredCode ? normalizeGameCode(preferredCode) : generateGameCode()
  let roomId = roomIdFromGameCode(gameCode)

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const existing = await gameRoomRepo.findById(roomId)
    if (!existing) break
    gameCode = generateGameCode()
    roomId = roomIdFromGameCode(gameCode)
  }

  const facilitatorId = `fac-${slugifyPlayerId(facilitatorName)}`
  await roomCommands.createRoom(roomId, facilitatorId, {
    gameCode,
    sessionMode,
    decisionTimerPreset,
  })
  setActiveRoom(roomId)

  return {
    gameCode,
    roomId,
    facilitatorId,
    facilitatorName: facilitatorName.trim() || 'Facilitator',
    sessionMode,
    decisionTimerPreset,
  }
}

export async function configureLobby(options) {
  const roomId = requireRoomId()
  return roomCommands.configureLobby(roomId, options)
}

export async function joinGame(gameCode, displayName) {
  const normalized = normalizeGameCode(gameCode)
  if (!normalized) {
    throw new Error('Enter the game code from your facilitator.')
  }

  const name = displayName.trim()
  if (!name) {
    throw new Error('Enter your name to register.')
  }

  const roomId = roomIdFromGameCode(normalized)
  const room = await gameRoomRepo.findById(roomId)
  if (!room) {
    throw new Error('Game not found. Check the code with your facilitator.')
  }
  if (!room.joinOpen) {
    throw new Error('This game has already started. Late registration is closed.')
  }

  const playerId = slugifyPlayerId(name)
  if (room.slots.some((slot) => slot.playerId === playerId)) {
    throw new Error('That name is already taken in this game. Try a different name.')
  }

  setActiveRoom(roomId)
  await roomCommands.joinRoom(roomId, playerId, name)

  const board = await roomQueries.getGameBoard(roomId)
  const slot = board?.players.find((p) => p.playerId === playerId)

  return {
    gameCode: normalized,
    roomId,
    playerId,
    displayName: name,
    archetypeId: slot?.archetypeId ?? null,
    archetypeLabel: slot?.archetypeLabel ?? null,
    archetypeTagline: slot?.archetypeTagline ?? null,
    characterName: slot?.characterName ?? null,
    age: slot?.age ?? null,
  }
}

export async function getGameBoard() {
  const roomId = requireRoomId()
  return roomQueries.getGameBoard(roomId)
}

export async function startRoomCycle() {
  const roomId = requireRoomId()
  return roomCommands.startCycle(roomId)
}

/** @deprecated Use startRoomCycle() — scenario is domain-driven. */
export async function startRoomTurn(_scenarioId) {
  return startRoomCycle()
}

export async function advanceRoomTurn() {
  const roomId = requireRoomId()
  return roomCommands.advanceTurn(roomId)
}

export async function getPlayerDashboard(playerId) {
  const board = await getGameBoard()
  const player = board?.players.find((p) => p.playerId === playerId)
  if (!player) return null
  return playerQueries.getDashboard(player.simulationId)
}

export async function getPlayerLensView(playerId, lens) {
  const board = await getGameBoard()
  const player = board?.players.find((p) => p.playerId === playerId)
  if (!player) return null
  return playerQueries.getLensView(player.simulationId, lens)
}

export async function getRoomLifeSummary() {
  const roomId = requireRoomId()
  const room = await gameRoomRepo.findById(roomId)
  if (!room) return null

  const sessions = []
  for (const slot of room.slots) {
    const sim = await simulationRepo.findById(slot.simulationId)
    if (sim) sessions.push(sim)
  }

  const archetypeLabels = Object.fromEntries(
    sessions.map((session) => [
      session.character.archetypeId,
      getArchetypeLabel(session.character.archetypeId),
    ]),
  )
  const summary = computeCampaignLifeSummary(sessions, archetypeLabels)
  return {
    ...summary,
    players: summary.players.map((player, index) => ({
      ...player,
      rank: index + 1,
    })),
  }
}

export async function submitPlayerDecision(playerId, strategy, rationale) {
  const roomId = requireRoomId()
  return roomCommands.submitDecision(roomId, playerId, strategy, rationale)
}

export async function submitPlayerAutoAdvisor(playerId) {
  const roomId = requireRoomId()
  return roomCommands.submitAutoAdvisor(roomId, playerId)
}

export async function submitPlayerCalendarChoice(playerId, allocationId) {
  const roomId = requireRoomId()
  return roomCommands.submitCalendarChoice(roomId, playerId, allocationId)
}

export async function dismissPlayerCalendarEvent(playerId) {
  const roomId = requireRoomId()
  const roomState = await gameRoomRepo.findById(roomId)
  if (!roomState) throw new Error('Room not found')

  const slot = roomState.slots.find((s) => s.playerId === playerId)
  if (!slot) throw new Error('Player not in room')

  const sim = await simulationRepo.findById(slot.simulationId)
  if (!sim) throw new Error('Simulation not found')

  const updated = dismissCalendarEvent(sim)
  await simulationRepo.save(updated)
  await syncRoomCalendarPhase(roomState, playerId, updated)
  return updated
}

export async function submitPlayerReflection(playerId, answers) {
  const roomId = requireRoomId()
  return roomCommands.submitReflection(roomId, playerId, answers)
}

export function configureWorkshopPersistence(repos) {
  if (repos.gameRoomRepo) gameRoomRepo = repos.gameRoomRepo
  if (repos.simulationRepo) simulationRepo = repos.simulationRepo
  roomCommands = new GameRoomCommandBus(gameRoomRepo, simulationRepo)
  roomQueries = new GameRoomQueryBus(gameRoomRepo, simulationRepo)
  playerQueries = new FinancialDecisionQueryBus(simulationRepo)
}

export function leaveActiveRoom() {
  activeRoomId = null
}

export function resetWorkshop() {
  gameRoomRepo = new InMemoryGameRoomRepository()
  simulationRepo = new InMemorySimulationRepository()
  roomCommands = new GameRoomCommandBus(gameRoomRepo, simulationRepo)
  roomQueries = new GameRoomQueryBus(gameRoomRepo, simulationRepo)
  playerQueries = new FinancialDecisionQueryBus(simulationRepo)
  activeRoomId = null
}
