import { SCENARIOS } from '../../lib/scenarios.js'
import { GAME_ROOM_MAX_PLAYERS } from '../../lib/spike-life-workshop-client.js'
import GameCodeBadge from './GameCodeBadge.jsx'

export default function FacilitatorPanel({
  board,
  busy,
  gameCode,
  onStartTurn,
  isFacilitator,
}) {
  if (!board || !isFacilitator) return null

  const canStart = board.roomPhase === 'lobby' && board.playerCount > 0

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Facilitator</h2>
      <p className="mt-1 text-xs text-slate-500">
        Room phase: <span className="font-medium capitalize">{board.roomPhase.replace('_', ' ')}</span>
      </p>

      {gameCode && (
        <div className="mt-4">
          <GameCodeBadge code={gameCode} />
          <p className="mt-2 text-xs text-slate-500">
            Players register at the workshop lobby with this code.
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">
        {board.playerCount}/{GAME_ROOM_MAX_PLAYERS} players registered
        {board.joinOpen && board.slotsOpen > 0 && (
          <span> · {board.slotsOpen} slot{board.slotsOpen !== 1 ? 's' : ''} open</span>
        )}
      </p>

      {board.roomPhase === 'lobby' && (
        <div className="mt-3">
          {board.players.length === 0 ? (
            <p className="text-sm text-slate-600">Waiting for players to join…</p>
          ) : (
            <ul className="space-y-1 text-sm text-slate-700">
              {board.players.map((p) => (
                <li key={p.playerId} className="truncate">
                  <span
                    className="mr-2 inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: p.tokenColor }}
                    aria-hidden
                  />
                  {p.displayName}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {canStart && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Start shared mission
          </p>
          <div className="mt-2 space-y-2">
            {SCENARIOS.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={busy}
                onClick={() => onStartTurn(item.id)}
                className="w-full rounded-lg border border-slate-200 p-3 text-left text-sm hover:border-[#8B0000]/40 hover:bg-red-50/30 disabled:opacity-50"
              >
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-600">{item.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {board.roomPhase === 'turn_active' && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Turn progress
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
