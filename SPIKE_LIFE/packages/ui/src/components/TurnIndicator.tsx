import type { BoardPhaseView } from '../types/view-models.js'

const PHASE_LABELS: Record<BoardPhaseView, string> = {
  ready_to_roll: 'Roll dice',
  decision_phase: 'Analyze & decide',
  turn_complete: 'End turn',
  round_complete: 'Year complete',
  game_complete: 'Journey complete',
}

export interface TurnIndicatorProps {
  phase: BoardPhaseView
  currentPlayerName?: string
  className?: string
}

export function TurnIndicator({ phase, currentPlayerName, className = '' }: TurnIndicatorProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800/90 px-3 py-1.5 text-sm ${className}`}
      role="status"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      <span className="font-medium text-slate-200">{PHASE_LABELS[phase]}</span>
      {currentPlayerName && (
        <span className="text-slate-400">· {currentPlayerName}</span>
      )}
    </div>
  )
}

export interface TurnCounterProps {
  roundNumber: number
  maxRounds: number
  boardYear: number
  className?: string
}

export function TurnCounter({ roundNumber, maxRounds, boardYear, className = '' }: TurnCounterProps) {
  return (
    <dl className={`flex gap-4 text-sm ${className}`}>
      <div>
        <dt className="text-xs text-slate-400">Year</dt>
        <dd className="font-bold text-white">{boardYear}</dd>
      </div>
      <div>
        <dt className="text-xs text-slate-400">Turn</dt>
        <dd className="font-bold text-white">
          {roundNumber} / {maxRounds}
        </dd>
      </div>
    </dl>
  )
}
