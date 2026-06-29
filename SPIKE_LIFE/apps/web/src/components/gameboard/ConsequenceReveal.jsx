import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

function DeltaRow({ label, before, after, unit = '', higherIsBetter = true }) {
  const improved = higherIsBetter ? after >= before : after <= before
  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-bold ${
        improved
          ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
          : 'border-amber-100 bg-amber-50 text-amber-700'
      }`}
    >
      <span className="uppercase tracking-wider text-slate-600">{label}</span>
      <span className="tabular-nums">
        {before}
        {unit} → {after}
        {unit}
      </span>
    </div>
  )
}

export default function ConsequenceReveal({ reveal, onContinue }) {
  const reduceMotion = useReducedMotion()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!reveal) return undefined
    setVisible(true)
    const id = setTimeout(() => onContinue?.(), reduceMotion ? 1200 : 3500)
    return () => clearTimeout(id)
  }, [reveal, onContinue, reduceMotion])

  if (!reveal || !visible) return null

  const scoreDelta = reveal.lifeScoreAfter - reveal.lifeScoreBefore

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8 }}
        className="life-glass-panel pointer-events-auto w-full max-w-md rounded-2xl border-2 border-indigo-300 p-5 text-center shadow-2xl"
      >
        <div className="mb-1 text-2xl" aria-hidden>
          🎉
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-indigo-600">
          {scoreDelta >= 0 ? 'Great decision!' : 'Tough trade-off'}
        </p>
        <h2 className="mt-1 text-lg font-black text-slate-900">
          Life Score {scoreDelta >= 0 ? '+' : ''}
          {scoreDelta}
        </h2>
        {reveal.qualityLabel && (
          <p className="mt-0.5 text-xs text-slate-500">{reveal.qualityLabel}</p>
        )}
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{reveal.narrative}</p>

        {reveal.deltas.length > 0 && (
          <div className="mt-4 space-y-2">
            {reveal.deltas.slice(0, 3).map((delta) => (
              <DeltaRow key={delta.label} {...delta} />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onContinue}
          className="focus-game mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Continue →
        </button>
      </motion.div>
    </div>
  )
}
