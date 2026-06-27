import { motion } from 'framer-motion'
import type { FinancialHUDProps } from '../../types/component-props.js'
import { LifeScoreRing } from './LifeScoreRing.js'

export type { FinancialHUDProps }

export function FinancialHUD({
  data,
  onOpenGrow,
  onOpenProtect,
  className = '',
  growLabel = 'Grow lens',
  protectLabel = 'Protect lens',
}: FinancialHUDProps) {
  if (!data) return null

  return (
    <footer
      className={`shrink-0 border-t border-slate-200 bg-white shadow-[0_-4px_24px_rgba(15,23,42,0.06)] ${className}`}
      style={{ minHeight: '15dvh' }}
      aria-label="Financial dashboard"
    >
      <div className="mx-auto flex h-full max-w-[100rem] flex-wrap items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-4">
          <LifeScoreRing score={data.lifeScore} size={44} strokeWidth={3} />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">Net worth</dt>
              <dd className="font-bold text-slate-900">{data.netWorth}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Cash flow</dt>
              <dd className="font-bold text-emerald-600">{data.monthlySurplus}/mo</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Protection</dt>
              <dd className="font-bold text-slate-900">{data.protection}/100</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Goals</dt>
              <dd className="font-bold text-slate-900">{data.goals}/100</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-wrap gap-2">
          {data.metrics.slice(0, 4).map((m) => (
            <motion.div
              key={m.label}
              layout
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {m.label}
              </p>
              <p
                className={`text-sm font-bold ${m.accent ? 'text-emerald-700' : 'text-slate-900'}`}
              >
                {m.value}
              </p>
            </motion.div>
          ))}
          {onOpenGrow && (
            <button
              type="button"
              onClick={onOpenGrow}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {growLabel}
            </button>
          )}
          {onOpenProtect && (
            <button
              type="button"
              onClick={onOpenProtect}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {protectLabel}
            </button>
          )}
        </div>
      </div>
    </footer>
  )
}
