import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export default function DreamProgressPulse({ goals = [], onComplete }) {
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!goals.length) return undefined
    const ms = reduceMotion ? 1200 : 2200
    const id = setTimeout(() => onComplete?.(), ms)
    return () => clearTimeout(id)
  }, [goals.length, onComplete, reduceMotion])

  if (!goals.length) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={reduceMotion ? false : { y: 16 }}
        animate={{ y: 0 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6"
      >
        <p className="text-center text-xs font-bold uppercase tracking-widest text-indigo-300">
          Dream board progress
        </p>
        <div className="mt-4 space-y-3">
          {goals.slice(0, 4).map((goal) => (
            <div key={goal.goalId}>
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>{goal.goalName}</span>
                <span className="font-bold text-white">{goal.progressPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
