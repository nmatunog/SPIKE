export default function LifeSummaryScreen({ summary, onPlayAgain }) {
  if (!summary?.complete) return null

  const winner = summary.players[0]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-white via-slate-50 to-sky-50/50 px-4 py-10">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
          Life complete
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">Most balanced life wins</h1>
        <p className="mt-2 text-slate-600">Not the richest — the most financially balanced.</p>

        {winner && (
          <div className="mt-8 rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-8 shadow-lg shadow-amber-100/50">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
              Life Score champion
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{winner.characterName}</p>
            <p className="text-slate-600">{winner.archetypeLabel}</p>
            <p className="mt-4 text-5xl font-black text-amber-600">{winner.overall}</p>
            <p className="text-sm text-amber-800/80">{winner.rating}</p>
          </div>
        )}

        <ul className="mt-8 space-y-3 text-left">
          {summary.players.map((p) => (
            <li
              key={p.sessionId}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  #{p.rank} {p.characterName}
                </p>
                <p className="text-xs text-slate-500">{p.archetypeLabel}</p>
              </div>
              <span className="text-xl font-bold text-sky-600">{p.overall}</span>
            </li>
          ))}
        </ul>

        {winner && (
          <p className="mt-6 text-sm italic text-slate-500">“{winner.advisorClosing}”</p>
        )}

        {onPlayAgain && (
          <button type="button" onClick={onPlayAgain} className="btn-primary mt-8 px-8">
            Play again
          </button>
        )}
      </div>
    </div>
  )
}
