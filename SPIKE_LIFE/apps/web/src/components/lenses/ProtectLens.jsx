function ReadinessRing({ percent }) {
  const color = percent >= 75 ? 'text-emerald-600' : percent >= 50 ? 'text-amber-600' : 'text-red-600'
  return (
    <span className={`text-2xl font-bold tabular-nums ${color}`}>{percent}%</span>
  )
}

export default function ProtectLens({ data }) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold text-slate-900">What could go wrong?</h2>
        <p className="mt-1 text-sm text-slate-500">
          Protection planning solutions — never insurance products.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Overall protection readiness</p>
        <p className="text-3xl font-bold text-[#8B0000]">{data.overallProtectionScore}</p>
        <p className="mt-2 text-sm text-slate-600">
          Family protection gap: {data.familyProtectionGap.formatted}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {data.plans.map((plan) => (
          <article
            key={plan.category}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h3 className="font-semibold text-slate-900">{plan.category}</h3>
            <ReadinessRing percent={plan.readinessPercent} />
            <p className="mt-2 text-sm text-slate-600">{plan.gapSummary}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
              Priority: {plan.priority}
            </p>
          </article>
        ))}
      </div>
    </div>
  )
}
