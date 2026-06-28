import { motion, useReducedMotion } from 'framer-motion'
import type { FinancialHUDProps } from '../../types/component-props.js'
import { motionTokens as t } from '../../motion/tokens.js'
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
  const reduceMotion = useReducedMotion()

  if (!data) return null

  const stats = [
    { label: 'Net worth', value: data.netWorth, accent: false },
    { label: 'Cash flow', value: `${data.monthlySurplus}/mo`, accent: true },
    { label: 'Protection', value: `${data.protection}/100`, accent: false, hideMobile: true },
    { label: 'Goals', value: `${data.goals}/100`, accent: false, hideMobile: true },
  ]

  return (
    <footer
      className={`shrink-0 border-t border-slate-200/80 bg-white/90 backdrop-blur-md ${className}`}
      aria-label="Wealth summary"
    >
      <div className="mx-auto flex min-h-[4.5rem] max-w-[120rem] items-center justify-between gap-4 px-4 py-3 sm:px-5 lg:min-h-[5rem] lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
          <LifeScoreRing score={data.lifeScore} size={44} strokeWidth={3} />
          <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className={item.hideMobile ? 'hidden sm:block' : ''}>
                <dt className="text-label uppercase text-slate-500">{item.label}</dt>
                <motion.dd
                  key={item.value}
                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: t.normal }}
                  className={`text-title font-bold tabular-nums ${item.accent ? 'text-emerald-600' : 'text-spike-ink'}`}
                >
                  {item.value}
                </motion.dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          {data.metrics.slice(0, 2).map((m, i) => (
            <motion.div
              key={m.label}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: t.normal }}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-2.5"
            >
              <p className="text-label uppercase text-slate-400">{m.label}</p>
              <p
                className={`text-body font-bold tabular-nums ${m.accent ? 'text-emerald-700' : 'text-spike-ink'}`}
              >
                {m.value}
              </p>
            </motion.div>
          ))}
          {onOpenGrow && (
            <button type="button" onClick={onOpenGrow} className="btn-secondary px-4 py-2.5 text-caption">
              {growLabel}
            </button>
          )}
          {onOpenProtect && (
            <button type="button" onClick={onOpenProtect} className="btn-secondary px-4 py-2.5 text-caption">
              {protectLabel}
            </button>
          )}
        </div>
      </div>
    </footer>
  )
}
