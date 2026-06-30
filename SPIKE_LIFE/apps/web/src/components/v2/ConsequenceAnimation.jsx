import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

function MetricIcon({ improved }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        improved ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
      }`}
      aria-hidden
    >
      {improved ? (
        <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
          <path d="M10 4l6 8H4l6-8z" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
          <path d="M10 16l-6-8h12l-6 8z" />
        </svg>
      )}
    </span>
  )
}

function ConsequenceRow({ row, index, variant = 'v2' }) {
  const rowClass = variant === 'v3' ? 'gsv3-consequence-row' : 'gsv2-consequence-row'
  const toneClass = row.improved
    ? (variant === 'v3' ? 'gsv3-consequence-row--up' : 'gsv2-consequence-row--up')
    : (variant === 'v3' ? 'gsv3-consequence-row--down' : 'gsv2-consequence-row--down')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.28 }}
      className={`${rowClass} flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 md:gap-4 md:rounded-2xl md:px-4 md:py-3 ${toneClass}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <MetricIcon improved={row.improved} />
        <span className="text-sm font-bold uppercase tracking-wide text-slate-800">
          {row.label}
        </span>
      </div>
      <span
        className={`shrink-0 text-sm font-bold tabular-nums ${
          row.improved ? 'text-emerald-700' : 'text-red-600'
        }`}
      >
        {row.displayValue}
      </span>
    </motion.div>
  )
}

export default function ConsequenceAnimation({ reveal, onComplete, variant = 'v2' }) {
  const reduceMotion = useReducedMotion()
  const isV3 = variant === 'v3'

  useEffect(() => {
    if (!reveal) return undefined
    const ms = reduceMotion ? 2200 : 3600
    const id = setTimeout(() => onComplete?.(), ms)
    return () => clearTimeout(id)
  }, [reveal, onComplete, reduceMotion])

  if (!reveal) return null

  const title = (reveal.headlineTitle ?? 'Life cycle adjustment').toUpperCase()
  const subtitle = reveal.decisionSubtitle ?? reveal.qualityLabel ?? ''
  const rows = reveal.rows?.length ? reveal.rows : []

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={
        isV3
          ? 'gsv3-consequence-stage h-full min-h-0'
          : 'absolute inset-0 z-30 flex items-center justify-center bg-white/70 p-4 backdrop-blur-md'
      }
    >
      <motion.div
        initial={reduceMotion ? false : { scale: 0.98, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={
          isV3
            ? 'gsv3-consequence-card'
            : 'gsv2-consequence-modal w-full max-w-md px-6 py-8 sm:max-w-lg sm:px-8'
        }
      >
        <div className={isV3 ? 'gsv3-consequence-card__head' : 'text-center'}>
          <span
            className={
              isV3
                ? 'gsv3-consequence-badge'
                : 'gsv2-consequence-badge inline-block rounded-full px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-indigo-800'
            }
          >
            Decision consequence
          </span>
          <h2
            className={
              isV3
                ? 'gsv3-consequence-title'
                : 'mt-5 font-sans text-display-sm font-semibold uppercase leading-tight tracking-tight text-slate-900 sm:text-display'
            }
          >
            {title}
          </h2>
          {subtitle && (
            <p className={isV3 ? 'gsv3-consequence-subtitle' : 'mt-2 text-sm italic text-slate-500'}>
              {subtitle}
            </p>
          )}
        </div>

        <div className={isV3 ? 'gsv3-consequence-rows' : 'mt-7 space-y-2.5'}>
          {rows.map((row, index) => (
            <ConsequenceRow key={row.label} row={row} index={index} variant={variant} />
          ))}
        </div>

        <div className={isV3 ? 'gsv3-consequence-foot' : 'mt-8 flex flex-col items-center gap-2'}>
          <span
            className={`${isV3 ? 'gsv3-consequence-spinner' : 'gsv2-consequence-spinner'} h-5 w-5 rounded-full border-2 border-violet-300 border-t-violet-600`}
            aria-hidden
          />
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-violet-400">
            Evaluating planning results…
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
