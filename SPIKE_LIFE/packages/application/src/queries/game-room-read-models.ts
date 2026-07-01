import type { LifeStage, PlayerSlotStatus, RoomPhase, SessionMode } from '@spike-life/domain'
import type { BoardStageView } from './read-models.js'

export interface PlayerTokenView {
  slotIndex: number
  playerId: string
  displayName: string
  tokenColor: string
  status: PlayerSlotStatus
  statusLabel: string
  simulationId: string
  lifeScoreOverall: number | null
  characterName: string | null
  archetypeId: string | null
  archetypeLabel: string | null
  archetypeTagline: string | null
  age: number | null
}

export interface GameBoardView {
  roomId: string
  gameCode: string
  facilitatorId: string
  roomPhase: RoomPhase
  sessionMode: SessionMode
  decisionTimerPreset: string
  cycleDeadlineAt: string | null
  turnNumber: number
  maxTurns: number
  lifeStage: LifeStage
  lifeStageLabel: string
  cycleLabel: string | null
  lifeDomains: Array<{
    id: string
    label: string
    category: string
    icon: string
    color: string
  }>
  domainAnimationCycle: readonly string[]
  selectedDomainId: string | null
  joinOpen: boolean
  playerCount: number
  maxPlayers: number
  slotsOpen: number
  boardStages: BoardStageView[]
  players: PlayerTokenView[]
  allPlayersDone: boolean
  canAdvanceTurn: boolean
  workshopComplete: boolean
  completionSummary: {
    done: number
    planning: number
    decided: number
    total: number
  }
}
