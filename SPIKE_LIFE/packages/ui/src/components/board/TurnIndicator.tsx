import type { BoardPhaseView } from '../../types/view-models.js'

const DEFAULT_PHASE_LABELS: Record<BoardPhaseView, string> = {
  ready_to_roll: 'Your move — next year',
  decision_phase: 'Plan your response',
  turn_complete: 'Wrap up this year',
  round_complete: 'Year complete',
  game_complete: 'Journey complete',
}

export interface TurnIndicatorProps {
  phase: BoardPhaseView
  phaseLabel?: string
  currentPlayerName?: string
  className?: string
}

export function TurnIndicator({
  phase,
  phaseLabel,
  currentPlayerName,
  className = '',
}: TurnIndicatorProps) {
  const label = phaseLabel ?? DEFAULT_PHASE_LABELS[phase]

  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-full border border-slate-600/80 bg-slate-800/95 px-4 py-2 text-body ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </span>
      <span className="font-semibold text-slate-100">{label}</span>
      {currentPlayerName && (
        <span className="text-slate-400">· {currentPlayerName}</span>
      )}
    </div>
  )
}
