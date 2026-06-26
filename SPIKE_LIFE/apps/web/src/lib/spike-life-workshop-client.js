import {
  InMemoryGameRoomRepository,
  InMemorySimulationRepository,
} from '@spike-life/infrastructure'
import {
  FinancialDecisionQueryBus,
  GameRoomCommandBus,
  GameRoomQueryBus,
  GAME_ROOM_MAX_PLAYERS,
} from '@spike-life/application'

export { GAME_ROOM_MAX_PLAYERS }

const DEFAULT_ROOM_ID = 'workshop-demo'

let gameRoomRepo = new InMemoryGameRoomRepository()
let simulationRepo = new InMemorySimulationRepository()
let roomCommands = new GameRoomCommandBus(gameRoomRepo, simulationRepo)
let roomQueries = new GameRoomQueryBus(gameRoomRepo, simulationRepo)
let playerQueries = new FinancialDecisionQueryBus(simulationRepo)

let roomId = DEFAULT_ROOM_ID
let roomEnsured = false

function resetRepos() {
  gameRoomRepo = new InMemoryGameRoomRepository()
  simulationRepo = new InMemorySimulationRepository()
  roomCommands = new GameRoomCommandBus(gameRoomRepo, simulationRepo)
  roomQueries = new GameRoomQueryBus(gameRoomRepo, simulationRepo)
  playerQueries = new FinancialDecisionQueryBus(simulationRepo)
  roomEnsured = false
}

export function getRoomId() {
  return roomId
}

export async function ensureRoom(facilitatorId = 'facilitator-demo') {
  if (roomEnsured) return roomId
  const existing = await gameRoomRepo.findById(roomId)
  if (!existing) {
    await roomCommands.createRoom(roomId, facilitatorId)
  }
  roomEnsured = true
  return roomId
}

export async function getGameBoard() {
  await ensureRoom()
  return roomQueries.getGameBoard(roomId)
}

export async function joinAsPlayer(playerId, displayName) {
  await ensureRoom()
  return roomCommands.joinRoom(roomId, playerId, displayName)
}

export async function addPlayer(displayName) {
  const name = displayName.trim()
  if (!name) {
    throw new Error('Enter a player name.')
  }
  const playerId = slugifyPlayerId(name)
  await ensureRoom()
  return roomCommands.joinRoom(roomId, playerId, name)
}

export async function startRoomTurn(scenarioId) {
  await ensureRoom()
  return roomCommands.startTurn(roomId, scenarioId)
}

export async function advanceRoomTurn() {
  await ensureRoom()
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

export async function submitPlayerDecision(playerId, strategy, rationale) {
  await ensureRoom()
  return roomCommands.submitDecision(roomId, playerId, strategy, rationale)
}

export async function submitPlayerReflection(playerId, answers) {
  await ensureRoom()
  return roomCommands.submitReflection(roomId, playerId, answers)
}

export function slugifyPlayerId(name) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || `player-${Date.now()}`
}

export function resetWorkshop() {
  resetRepos()
}
