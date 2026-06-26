const STAGE_ICONS = {
  launch: '🚀',
  build: '🏠',
  grow: '📈',
  lead: '👔',
  legacy: '🌳',
}

function StageNode({ stage, isLast }) {
  const icon = STAGE_ICONS[stage.lifeStage] ?? '●'
  const isCurrent = stage.status === 'current'
  const isPast = stage.status === 'past'

  return (
    <div className="flex flex-1 items-center min-w-0">
      <div className="flex flex-col items-center flex-1 min-w-0">
        <div
          className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 text-xl transition-all ${
            isCurrent
              ? 'border-[#8B0000] bg-red-50 shadow-md ring-4 ring-red-100'
              : isPast
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 bg-white text-slate-400'
          }`}
        >
          <span aria-hidden>{icon}</span>
          {isCurrent && (
            <span
              className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[#8B0000] ring-2 ring-white"
              title="You are here"
            />
          )}
        </div>
        <p
          className={`mt-2 text-center text-xs font-semibold uppercase tracking-wide ${
            isCurrent ? 'text-[#8B0000]' : isPast ? 'text-emerald-700' : 'text-slate-400'
          }`}
        >
          {stage.label}
        </p>
        <p className="text-[10px] text-slate-400">Turn {stage.turnNumber}</p>
      </div>
      {!isLast && (
        <div
          className={`mx-1 mb-6 h-0.5 flex-1 ${
            isPast ? 'bg-emerald-400' : 'bg-slate-200'
          }`}
          aria-hidden
        />
      )}
    </div>
  )
}

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

      <div className="mt-6 flex items-start overflow-x-auto pb-2">
        {boardStages.map((stage, index) => (
          <StageNode
            key={stage.lifeStage}
            stage={stage}
            isLast={index === boardStages.length - 1}
          />
        ))}
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
