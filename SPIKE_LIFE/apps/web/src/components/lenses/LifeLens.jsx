function ScoreBar({ label, value }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-[#8B0000] transition-all"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  )
}

export default function LifeLens({ dashboard }) {
  const event = dashboard.currentEvent

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Where am I right now?</h2>
        <p className="mt-1 text-sm text-slate-500">
          Life Score™: {dashboard.lifeScore.rating}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Monthly income</p>
            <p className="text-lg font-semibold">{dashboard.monthlyIncome.formatted}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Monthly surplus</p>
            <p className="text-lg font-semibold">{dashboard.monthlySurplus.formatted}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Net worth</p>
            <p className="text-lg font-semibold">{dashboard.netWorth.formatted}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Life Score breakdown</h3>
        <div className="mt-4 space-y-3">
          <ScoreBar label="Cash Flow" value={dashboard.lifeScore.cashFlow} />
          <ScoreBar label="Protection" value={dashboard.lifeScore.protection} />
          <ScoreBar label="Goals" value={dashboard.lifeScore.goals} />
          <ScoreBar label="Wealth" value={dashboard.lifeScore.wealth} />
          <ScoreBar label="Retirement" value={dashboard.lifeScore.retirement} />
          <ScoreBar label="Decision Impact" value={dashboard.lifeScore.impact} />
        </div>
      </section>

      {event && (
        <section className="rounded-xl border border-[#8B0000]/20 bg-red-50/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8B0000]">
            Current life event
          </p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">{event.title}</h3>
          <p className="mt-2 text-slate-700">{event.narrative}</p>
          <p className="mt-3 text-sm font-medium text-slate-800">
            {event.financialImpactSummary}
          </p>
          <p className="mt-2 text-sm text-slate-600">{event.learningObjective}</p>
        </section>
      )}

      {dashboard.topPriority && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Top planning priority</h3>
          <p className="mt-2 text-[#8B0000] font-medium">{dashboard.topPriority}</p>
          {dashboard.fnaRating && (
            <p className="mt-1 text-sm text-slate-600">FNA rating: {dashboard.fnaRating}</p>
          )}
        </section>
      )}

      {dashboard.canDecide && (
        <p className="text-sm text-slate-600">
          Switch to the <strong>Plan</strong> lens to review recommendations and record your decision.
        </p>
      )}
      {dashboard.canReflect && (
        <p className="text-sm text-slate-600">
          Switch to the <strong>Journey</strong> lens to complete your reflection.
        </p>
      )}
      {dashboard.cycleComplete && !dashboard.canAdvanceTurn && !dashboard.workshopComplete && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Planning cycle complete. Use <strong>Advance to next turn</strong> on the board when ready.
        </p>
      )}
    </div>
  )
}
