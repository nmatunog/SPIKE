import { SCENARIOS } from '../../lib/scenarios.js'

export default function FacilitatorPanel({
  board,
  busy,
  onAddDemoPlayers,
  onStartTurn,
  isFacilitator,
}) {
  if (!board || !isFacilitator) return null

  const canStart = board.roomPhase === 'lobby' && board.playerCount > 0
  const canAdd = board.joinOpen && board.slotsOpen > 0

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Facilitator</h2>
      <p className="mt-1 text-xs text-slate-500">
        Room phase: <span className="font-medium capitalize">{board.roomPhase.replace('_', ' ')}</span>
      </p>

      {canAdd && (
        <button
          type="button"
          disabled={busy}
          onClick={onAddDemoPlayers}
          className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50"
        >
          Add 10 demo interns
        </button>
      )}

      {board.joinOpen && (
        <p className="mt-2 text-xs text-slate-500">
          {board.slotsOpen} slot{board.slotsOpen !== 1 ? 's' : ''} open
        </p>
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
