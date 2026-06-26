import LifeScoreRing from './LifeScoreRing.jsx'

export default function JourneyFooter({ dashboard, board, journeyView }) {
  if (!dashboard) return null

  const timeline = journeyView?.lens === 'journey' ? journeyView.data.timeline : []
  const turns = dashboard.turnHistory ?? []
  const maxTurns = board?.maxRounds ?? dashboard.maxTurns
  const currentTurn = board?.roundNumber ?? dashboard.turnNumber

  const turnItems = Array.from({ length: maxTurns }, (_, i) => {
    const n = i + 1
    const hist = turns.find((t) => t.turnNumber === n)
    return {
      n,
      label: hist?.lifeStageLabel ?? (n === currentTurn ? 'In progress' : 'Upcoming'),
      done: n < currentTurn,
      current: n === currentTurn,
    }
  })

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-3 px-3 py-3 md:flex-row md:items-center md:justify-between md:px-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Journey timeline
          </p>
          <ol className="mt-2 flex flex-wrap gap-2">
            {turnItems.map((turn) => (
              <li
                key={turn.n}
                className={`rounded-lg px-2.5 py-1.5 text-xs ${
                  turn.current
                    ? 'bg-[#8B0000] font-semibold text-white'
                    : turn.done
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                Turn {turn.n}
                <span className="ml-1 hidden sm:inline opacity-80">· {turn.label}</span>
              </li>
            ))}
          </ol>
          {timeline.length > 0 && (
            <p className="mt-2 truncate text-[11px] text-slate-500">
              Latest: {timeline[timeline.length - 1]?.title}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
          <LifeScoreRing
            score={dashboard.lifeScore.overall}
            label="Life score"
            size={56}
            compact={false}
          />
        </div>
      </div>
    </footer>
  )
}
