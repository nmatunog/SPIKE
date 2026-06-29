import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

function DeltaBar({ label, before, after, unit = '', higherIsBetter = true }) {
  const max = Math.max(before, after, 1)
  const beforePct = Math.round((before / max) * 100)
  const afterPct = Math.round((after / max) * 100)
  const improved = higherIsBetter ? after >= before : after <= before

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-slate-300">{label}</p>
        <p className={`text-sm font-bold tabular-nums ${improved ? 'text-emerald-300' : 'text-amber-300'}`}>
          {before}{unit} → {after}{unit}
        </p>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-slate-500"
            initial={{ width: `${beforePct}%` }}
            animate={{ width: `${beforePct}%` }}
          />
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className={`h-full rounded-full ${improved ? 'bg-emerald-400' : 'bg-amber-400'}`}
            initial={{ width: `${beforePct}%` }}
            animate={{ width: `${afterPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}

export default function ConsequenceReveal({ reveal, onContinue }) {
  const reduceMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!reveal) return undefined
    setVisible(true)
    const id = setTimeout(() => onContinue?.(), reduceMotion ? 1200 : 3200)
    return () => clearTimeout(id)
  }, [reveal, onContinue, reduceMotion])

  if (!reveal || !visible) return null

  const scoreDelta = reveal.lifeScoreAfter - reveal.lifeScoreBefore

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/92 p-4 backdrop-blur-md">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
          {scoreDelta >= 0 ? 'Great decision' : 'Tough trade-off'}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">
          Life Score {reveal.lifeScoreBefore} → {reveal.lifeScoreAfter}
        </h2>
        {reveal.qualityLabel && (
          <p className="mt-1 text-sm text-slate-400">{reveal.qualityLabel}</p>
        )}
        <p className="mt-4 text-sm leading-relaxed text-slate-300">{reveal.narrative}</p>

        <div className="mt-6 space-y-3">
          {reveal.deltas.map((delta) => (
            <DeltaBar key={delta.label} {...delta} />
          ))}
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
        >
          Continue →
        </button>
      </motion.div>
    </div>
  )
}
