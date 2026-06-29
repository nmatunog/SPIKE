export default function AnnualCheckpointCard({ checkpoint, onContinue }) {
  if (!checkpoint) return null

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-xl shadow-slate-200/60">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
        Year {checkpoint.simulationYear} review
      </p>
      <h3 className="mt-1 text-lg font-bold text-slate-900">Financial checkpoint</h3>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
          <dt className="text-slate-500">Net worth</dt>
          <dd className="font-semibold text-slate-900">{checkpoint.netWorth.formatted}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
          <dt className="text-slate-500">Monthly surplus</dt>
          <dd className="font-semibold text-slate-900">{checkpoint.monthlySurplus.formatted}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
          <dt className="text-slate-500">Emergency fund</dt>
          <dd className="font-semibold text-slate-900">{checkpoint.emergencyFundProgress}%</dd>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
          <dt className="text-slate-500">Life Score</dt>
          <dd className="font-semibold text-emerald-700">{checkpoint.lifeScoreOverall}</dd>
        </div>
      </dl>

      <p className="mt-4 text-sm italic text-slate-600">“{checkpoint.advisorInsight}”</p>

      {onContinue && (
        <button type="button" onClick={onContinue} className="btn-primary mt-4 w-full">
          Continue
        </button>
      )}
    </div>
  )
}
