import {
  GAME_ROOM_MAX_PLAYERS,
  GAME_ROOM_MIN_PLAYERS,
} from '../../lib/spike-life-workshop-client.js'
import GameCodeBadge from './GameCodeBadge.jsx'

const ACTIVE_ROOM_PHASES = new Set(['turn_active', 'cycle_active', 'awaiting_calendar'])

function formatTimerPreset(preset) {
  if (preset === 'off') return 'Off'
  return `${preset}s`
}

export default function RoomPanel({
  board,
  busy,
  gameCode,
  onStartCycle,
}) {
  if (!board) return null

  const setupPhase = board.roomPhase === 'setup' || board.roomPhase === 'lobby'
  const canStart = board.canStartCycle
  const waitingForMore =
    setupPhase
    && board.playerCount > 0
    && board.playerCount < GAME_ROOM_MIN_PLAYERS
  const waitingForSetup =
    setupPhase
    && board.playerCount >= GAME_ROOM_MIN_PLAYERS
    && !canStart
  const cycleActive = ACTIVE_ROOM_PHASES.has(board.roomPhase)

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Room</h2>
      <p className="mt-1 text-xs text-slate-500">
        Phase: <span className="font-medium capitalize">{board.roomPhase.replace(/_/g, ' ')}</span>
      </p>

      {gameCode && (
        <div className="mt-4">
          <GameCodeBadge code={gameCode} />
          <p className="mt-2 text-xs text-slate-500">
            Share this code so others can join before the first cycle starts.
          </p>
        </div>
      )}

      {setupPhase && (
        <dl className="mt-4 space-y-1 text-xs text-slate-600">
          <div className="flex justify-between gap-2">
            <dt>Session mode</dt>
            <dd className="font-medium capitalize text-slate-800">
              {board.sessionMode?.replace('_', ' ') ?? 'workshop compressed'}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Decision timer</dt>
            <dd className="font-medium text-slate-800">
              {formatTimerPreset(board.decisionTimerPreset ?? '10')}
            </dd>
          </div>
        </dl>
      )}

      <p className="mt-4 text-xs text-slate-500">
        {board.playerCount}/{GAME_ROOM_MAX_PLAYERS} players
        {board.joinOpen && board.slotsOpen > 0 && (
          <span> · {board.slotsOpen} slot{board.slotsOpen !== 1 ? 's' : ''} open</span>
        )}
      </p>

      {setupPhase && (
        <div className="mt-3">
          {board.players.length === 0 ? (
            <p className="text-sm text-slate-600">Waiting for players…</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-700">
              {board.players.map((p) => (
                <li key={p.playerId} className="truncate">
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: p.tokenColor }}
                    aria-hidden
                  />
                  <span className="font-medium">{p.displayName}</span>
                  <span className="ml-1 text-xs text-slate-500">· {p.statusLabel}</span>
                  {p.archetypeLabel && (
                    <span className="block pl-4 text-xs text-slate-500">
                      {p.archetypeLabel}
                      {p.age ? ` · age ${p.age}` : ''}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {waitingForMore && (
            <p className="mt-2 text-xs text-amber-700">
              Need at least {GAME_ROOM_MIN_PLAYERS} players before starting.
            </p>
          )}
          {waitingForSetup && (
            <p className="mt-2 text-xs text-amber-700">
              {board.completionSummary.setupPending} player
              {board.completionSummary.setupPending !== 1 ? 's' : ''} still setting up Life Blueprint
              ({board.completionSummary.ready}/{board.completionSummary.total} ready).
            </p>
          )}
        </div>
      )}

      {canStart && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Start planning cycle
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Everyone is ready — any player can start the first cycle.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={onStartCycle}
            className="mt-3 w-full rounded-lg bg-[#8B0000] px-4 py-3 text-sm font-medium text-white hover:bg-[#6d0000] disabled:opacity-50"
          >
            {busy ? 'Starting…' : 'Start cycle →'}
          </button>
        </div>
      )}

      {cycleActive && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cycle progress
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            <li className="flex justify-between">
              <span className="text-slate-600">Planning</span>
              <span className="font-medium">{board.completionSummary.planning}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-600">Decided</span>
              <span className="font-medium">{board.completionSummary.decided}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-600">Done</span>
              <span className="font-medium text-emerald-700">{board.completionSummary.done}</span>
            </li>
          </ul>
        </div>
      )}
    </aside>
  )
}
