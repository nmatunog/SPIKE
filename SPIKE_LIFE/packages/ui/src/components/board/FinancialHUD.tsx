import { motion } from 'framer-motion'
import type { FinancialHUDProps } from '../../types/component-props.js'
import { LifeScoreRing } from './LifeScoreRing.js'

export type { FinancialHUDProps }

export function FinancialHUD({
  data,
  onOpenGrow,
  onOpenProtect,
  className = '',
  growLabel = 'Grow',
  protectLabel = 'Protect',
}: FinancialHUDProps) {
  if (!data) return null

  return (
    <footer
      className={`shrink-0 border-t border-slate-200/90 bg-white/95 backdrop-blur-sm ${className}`}
      aria-label="Financial dashboard"
    >
      <div className="mx-auto flex h-16 max-w-[100rem] items-center justify-between gap-4 px-4 lg:px-5">
        <div className="flex min-w-0 items-center gap-4">
          <LifeScoreRing score={data.lifeScore} size={40} strokeWidth={3} />
          <dl className="grid grid-cols-2 gap-x-5 gap-y-0.5 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs font-medium text-slate-500">Net worth</dt>
              <dd className="text-base font-bold text-slate-900">{data.netWorth}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Cash flow</dt>
              <dd className="text-base font-bold text-emerald-600">{data.monthlySurplus}/mo</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Protection</dt>
              <dd className="text-base font-bold text-slate-900">{data.protection}/100</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Goals</dt>
              <dd className="text-base font-bold text-slate-900">{data.goals}/100</dd>
            </div>
          </dl>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {data.metrics.slice(0, 3).map((m) => (
            <motion.div
              key={m.label}
              layout
              className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-1.5 shadow-sm"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {m.label}
              </p>
              <p className={`text-sm font-bold ${m.accent ? 'text-emerald-700' : 'text-slate-900'}`}>
                {m.value}
              </p>
            </motion.div>
          ))}
          {onOpenGrow && (
            <button type="button" onClick={onOpenGrow} className="btn-secondary px-3 py-2 text-xs">
              {growLabel}
            </button>
          )}
          {onOpenProtect && (
            <button type="button" onClick={onOpenProtect} className="btn-secondary px-3 py-2 text-xs">
              {protectLabel}
            </button>
          )}
        </div>
      </div>
    </footer>
  )
}
