import { StageTrack } from './StageTrack.jsx'

export default function LifeBoard({
  dashboard,
  onAdvanceTurn,
  advancing = false,
}) {
  if (!dashboard) return null

  const { boardStages, turnNumber, maxTurns, canAdvanceTurn, workshopComplete } = dashboard

  return (
    <section className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8B0000]">
            Life Journey Board
          </p>
          <h2 className="text-lg font-semibold text-slate-900">
            Turn {turnNumber} of {maxTurns}
            <span className="ml-2 text-sm font-normal text-slate-500">
              · Year {dashboard.simulationYear}
            </span>
          </h2>
        </div>
        {canAdvanceTurn && (
          <button
            type="button"
            disabled={advancing}
            onClick={onAdvanceTurn}
            className="rounded-lg bg-[#8B0000] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#6d0000] disabled:opacity-50"
          >
            {advancing ? 'Advancing…' : 'Advance to next turn →'}
          </button>
        )}
        {workshopComplete && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            Workshop complete — all 5 life stages practiced.
          </p>
        )}
      </div>

      <div className="mt-6">
        <StageTrack boardStages={boardStages} />
      </div>

      {dashboard.currentEvent && (
        <div className="mt-4 rounded-lg border border-[#8B0000]/20 bg-red-50/50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8B0000]">
            Active mission
          </p>
          <p className="mt-1 font-medium text-slate-900">{dashboard.currentEvent.title}</p>
        </div>
      )}

      {!dashboard.currentEvent && dashboard.canStartScenario && (
        <p className="mt-4 text-sm text-slate-600">
          Choose a planning scenario below to begin this turn.
        </p>
      )}

      {dashboard.turnHistory.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Completed turns
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {dashboard.turnHistory.map((turn) => (
              <li
                key={turn.turnNumber}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
              >
                T{turn.turnNumber} {turn.lifeStageLabel}
                {turn.lifeScoreOverall != null ? ` · ${turn.lifeScoreOverall}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
