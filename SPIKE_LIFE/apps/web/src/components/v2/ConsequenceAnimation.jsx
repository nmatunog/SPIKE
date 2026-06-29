import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

function StatDelta({ label, before, after, unit = '', flash }) {
  const delta = after - before
  const improved = delta >= 0
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 ${
        flash ? (improved ? 'gsv2-stat-flash-up' : 'gsv2-stat-flash-down') : ''
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-black tabular-nums ${improved ? 'text-emerald-700' : 'text-amber-700'}`}>
        {before}
        {unit} → {after}
        {unit}
        {delta !== 0 && (
          <span className="ml-2 text-sm">
            ({delta > 0 ? '+' : ''}
            {delta}
            {unit})
          </span>
        )}
      </p>
    </motion.div>
  )
}

export default function ConsequenceAnimation({ reveal, onComplete }) {
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!reveal) return undefined
    const ms = reduceMotion ? 1800 : 3200
    const id = setTimeout(() => onComplete?.(), ms)
    return () => clearTimeout(id)
  }, [reveal, onComplete, reduceMotion])

  if (!reveal) return null

  const scoreDelta = reveal.lifeScoreAfter - reveal.lifeScoreBefore

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={reduceMotion ? false : { scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/80"
      >
        <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
          {scoreDelta >= 0 ? 'Consequences revealed' : 'Tough trade-off'}
        </p>
        <h2 className="mt-2 text-center text-3xl font-black text-slate-900">
          Life Score {reveal.lifeScoreBefore} → {reveal.lifeScoreAfter}
        </h2>
        {reveal.qualityLabel && (
          <p className="mt-1 text-center text-sm text-slate-500">{reveal.qualityLabel}</p>
        )}
        <p className="mt-4 text-center text-sm leading-relaxed text-slate-600">{reveal.narrative}</p>

        <div className="mt-6 space-y-2">
          {reveal.deltas?.map((d, i) => (
            <StatDelta key={d.label} {...d} flash={i === 0} />
          ))}
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700"
        >
          See dream progress →
        </button>
      </motion.div>
    </motion.div>
  )
}
