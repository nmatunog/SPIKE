import type { SessionMode } from '../types.js'
import type { DecisionTimerPreset } from '@spike-life/content-core'

/** Short join code for workshop rooms (e.g. AB12CD). */
export function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]!
  }
  return code
}

export interface CreateRoomOptions {
  maxPlayers?: number
  sessionMode?: SessionMode
  decisionTimerPreset?: DecisionTimerPreset
  gameCode?: string
}
