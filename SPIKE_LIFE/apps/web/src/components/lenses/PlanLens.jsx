function PriorityBadge({ priority }) {
  const colors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[priority] ?? colors.low}`}>
      {priority}
    </span>
  )
}

export default function PlanLens({
  data,
  onDecide,
  deciding,
  error,
}) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold text-slate-900">What am I trying to achieve?</h2>
        <p className="mt-1 text-sm text-slate-500">
          Financial Needs Analysis drives every recommendation below.
        </p>
      </section>

      {data.fna && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">FNA Summary</h3>
            <span className="text-sm text-slate-500">
              Score {data.fna.overallScore} — {data.fna.rating}
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {data.fna.gaps.slice(0, 3).map((gap) => (
              <li key={gap.dimension} className="flex items-start justify-between gap-2 text-sm">
                <span className="text-slate-700">{gap.summary}</span>
                <PriorityBadge priority={gap.priority} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Recommended actions</h3>
        <ol className="mt-4 space-y-3">
          {data.recommendations.map((rec) => (
            <li key={rec.rank} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-900">
                  {rec.rank}. {rec.label}
                </span>
                <PriorityBadge priority={rec.priority} />
              </div>
              <p className="mt-1 text-sm text-slate-600">{rec.rationale}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Goals</h3>
        <ul className="mt-4 space-y-3">
          {data.goals.map((goal) => (
            <li key={goal.goalId}>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{goal.goalName}</span>
                <span className="text-slate-500">{goal.progressPercent}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-[#8B0000]"
                  style={{ width: `${goal.progressPercent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {goal.currentFunding.formatted} of {goal.targetAmount.formatted}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {data.canDecide && (
        <section className="rounded-xl border-2 border-[#8B0000]/30 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">How will you use your raise?</h3>
          <p className="mt-1 text-sm text-slate-600">
            Choose a planning action. Outcomes are deterministic — calculated by the simulation engine.
          </p>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.decisionOptions.map((opt) => (
              <button
                key={opt.strategy}
                type="button"
                disabled={deciding}
                onClick={() => onDecide(opt.strategy)}
                className="rounded-lg border border-slate-200 p-4 text-left transition hover:border-[#8B0000]/40 hover:bg-red-50/30 disabled:opacity-50"
              >
                <p className="font-medium text-slate-900">{opt.label}</p>
                <p className="mt-1 text-sm text-slate-600">{opt.description}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {data.selectedStrategy && !data.canDecide && (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-600">Decision recorded</p>
          <p className="mt-1 font-medium capitalize">
            {data.selectedStrategy.replace(/_/g, ' ')}
          </p>
          {data.decisionQuality && (
            <p className="mt-1 text-sm text-[#8B0000]">Quality: {data.decisionQuality}</p>
          )}
        </section>
      )}
    </div>
  )
}
