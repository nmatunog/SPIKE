function StatCard({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export default function GrowLens({ data }) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold text-slate-900">How am I building wealth?</h2>
        <p className="mt-1 text-sm text-slate-500">Cash flow and balance sheet snapshot.</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold">Cash flow</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <StatCard label="Income" value={data.cashFlow.monthlyIncome.formatted} />
          <StatCard label="Expenses" value={data.cashFlow.monthlyExpenses.formatted} />
          <StatCard label="Surplus" value={data.cashFlow.monthlySurplus.formatted} />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Debt ratio: {data.cashFlow.debtRatioPercent}% of income
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold">Assets</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Cash</dt><dd>{data.assets.cash.formatted}</dd></div>
            <div className="flex justify-between"><dt>Investments</dt><dd>{data.assets.investments.formatted}</dd></div>
            <div className="flex justify-between"><dt>Property</dt><dd>{data.assets.property.formatted}</dd></div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <dt>Total</dt><dd>{data.assets.total.formatted}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold">Liabilities</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Credit card</dt><dd>{data.liabilities.creditCard.formatted}</dd></div>
            <div className="flex justify-between"><dt>Personal loan</dt><dd>{data.liabilities.personalLoan.formatted}</dd></div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <dt>Total</dt><dd>{data.liabilities.total.formatted}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-xl border border-[#8B0000]/20 bg-red-50/30 p-5">
        <p className="text-sm text-slate-600">Net worth</p>
        <p className="text-3xl font-bold text-[#8B0000]">{data.netWorth.formatted}</p>
      </section>
    </div>
  )
}
