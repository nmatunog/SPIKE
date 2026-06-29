export default function AnnualCheckpointCard({ checkpoint, onContinue }) {
  if (!checkpoint) return null

  return (
    <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-slate-900/95 to-emerald-950/30 p-5 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
        Year {checkpoint.simulationYear} review
      </p>
      <h3 className="mt-1 text-lg font-bold text-white">Financial checkpoint</h3>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-black/20 px-3 py-2">
          <dt className="text-slate-400">Net worth</dt>
          <dd className="font-semibold text-white">{checkpoint.netWorth.formatted}</dd>
        </div>
        <div className="rounded-xl bg-black/20 px-3 py-2">
          <dt className="text-slate-400">Monthly surplus</dt>
          <dd className="font-semibold text-white">{checkpoint.monthlySurplus.formatted}</dd>
        </div>
        <div className="rounded-xl bg-black/20 px-3 py-2">
          <dt className="text-slate-400">Emergency fund</dt>
          <dd className="font-semibold text-white">{checkpoint.emergencyFundProgress}%</dd>
        </div>
        <div className="rounded-xl bg-black/20 px-3 py-2">
          <dt className="text-slate-400">Life Score</dt>
          <dd className="font-semibold text-emerald-300">{checkpoint.lifeScoreOverall}</dd>
        </div>
      </dl>

      <p className="mt-4 text-sm italic text-slate-300">“{checkpoint.advisorInsight}”</p>

      {onContinue && (
        <button type="button" onClick={onContinue} className="btn-primary mt-4 w-full">
          Continue
        </button>
      )}
    </div>
  )
}
