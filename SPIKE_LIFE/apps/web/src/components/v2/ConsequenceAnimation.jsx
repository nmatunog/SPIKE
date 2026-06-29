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

function ConsequenceRow({ row, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.28 }}
      className={`gsv2-consequence-row flex items-center justify-between gap-4 rounded-2xl px-4 py-3.5 ${
        row.improved ? 'gsv2-consequence-row--up' : 'gsv2-consequence-row--down'
      }`}
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

export default function ConsequenceAnimation({ reveal, onComplete }) {
  const reduceMotion = useReducedMotion()

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
      className="absolute inset-0 z-30 flex items-center justify-center bg-white/70 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={reduceMotion ? false : { scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="gsv2-consequence-modal w-full max-w-md px-6 py-8 sm:max-w-lg sm:px-8"
      >
        <div className="text-center">
          <span className="gsv2-consequence-badge inline-block rounded-full px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-indigo-800">
            Decision consequence
          </span>
          <h2 className="mt-5 font-serif text-2xl font-bold uppercase leading-tight tracking-wide text-slate-900 sm:text-[1.75rem]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm italic text-slate-500">{subtitle}</p>
          )}
        </div>

        <div className="mt-7 space-y-2.5">
          {rows.map((row, index) => (
            <ConsequenceRow key={row.label} row={row} index={index} />
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <span
            className="gsv2-consequence-spinner h-5 w-5 rounded-full border-2 border-violet-300 border-t-violet-600"
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
