export default function WorkshopScoreHud({ board, selectedPlayer }) {
  if (!board) return null

  const pct =
    board.completionSummary.total > 0
      ? Math.round((board.completionSummary.done / board.completionSummary.total) * 100)
      : 0

  return (
    <aside className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-white shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
        Room HUD
      </p>

      <div className="mt-4">
        <p className="text-3xl font-bold tabular-nums">{pct}%</p>
        <p className="text-sm text-slate-300">turn complete</p>
        <div className="mt-2 h-2 rounded-full bg-slate-700">
          <div
            className="h-2 rounded-full bg-emerald-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {board.completionSummary.done} of {board.completionSummary.total} players done
        </p>
      </div>

      {selectedPlayer && (
        <div className="mt-6 border-t border-slate-700 pt-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Selected player</p>
          <p className="mt-1 font-semibold">{selectedPlayer.displayName}</p>
          <p className="text-sm text-slate-300">{selectedPlayer.statusLabel}</p>
          {selectedPlayer.lifeScoreOverall != null && (
            <p className="mt-2 text-lg font-bold text-red-200">
              Life Score™ {selectedPlayer.lifeScoreOverall}
            </p>
          )}
          {selectedPlayer.archetypeLabel && (
            <p className="mt-1 text-sm text-sky-200">
              {selectedPlayer.archetypeLabel}
              {selectedPlayer.age ? ` · age ${selectedPlayer.age}` : ''}
            </p>
          )}
          {selectedPlayer.archetypeTagline && (
            <p className="mt-1 text-xs text-slate-400">{selectedPlayer.archetypeTagline}</p>
          )}
          {selectedPlayer.characterName && (
            <p className="mt-1 text-xs text-slate-400">
              Character: {selectedPlayer.characterName}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 border-t border-slate-700 pt-4 text-xs text-slate-400 space-y-1">
        <p>Stage: {board.lifeStageLabel}</p>
        <p>Players: {board.playerCount}/{board.maxPlayers}</p>
      </div>
    </aside>
  )
}
