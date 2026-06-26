export default function LeftFinancialSnapshot({ dashboard, growView, planView }) {
  if (!dashboard) return null

  const grow = growView?.lens === 'grow' ? growView.data : null
  const fna = planView?.lens === 'plan' ? planView.data.fna : null
  const income = grow?.cashFlow.monthlyIncome.amount ?? dashboard.monthlyIncome.amount
  const surplus = dashboard.monthlySurplus.amount
  const savingsRate = income > 0 ? Math.round((surplus / income) * 100) : null
  const efProgress = fna?.emergencyFundProgress

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        Financial snapshot
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
        <Metric label="Income" value={dashboard.monthlyIncome.formatted} suffix="/mo" />
        <Metric
          label="Expenses"
          value={grow ? grow.cashFlow.monthlyExpenses.formatted : '—'}
          suffix={grow ? '/mo' : ''}
        />
        <Metric
          label="Savings rate"
          value={savingsRate != null ? `${savingsRate}%` : '—'}
          accent
        />
        <Metric label="Net worth" value={dashboard.netWorth.formatted} />
        <Metric
          label="Emergency fund"
          value={efProgress != null ? `${(efProgress * 6).toFixed(1)} mo` : '—'}
        />
        <Metric
          label="Protection"
          value={`${dashboard.lifeScore.protection}/100`}
        />
      </dl>
    </div>
  )
}

function Metric({ label, value, suffix = '', accent = false }) {
  return (
    <div>
      <dt className="text-[10px] text-slate-400">{label}</dt>
      <dd className={`font-semibold ${accent ? 'text-emerald-700' : 'text-slate-900'}`}>
        {value}
        {suffix && <span className="font-normal text-slate-500">{suffix}</span>}
      </dd>
    </div>
  )
}
