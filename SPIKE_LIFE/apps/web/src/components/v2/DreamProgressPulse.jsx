import { useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export default function DreamProgressPulse({ goals = [], onComplete, variant = 'v2' }) {
  const reduceMotion = useReducedMotion()
  const isV3 = variant === 'v3'

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
      className={
        isV3
          ? 'gsv3-consequence-stage h-full min-h-0'
          : 'absolute inset-0 z-30 flex items-center justify-center bg-white/75 p-4 backdrop-blur-sm'
      }
    >
      <motion.div
        initial={reduceMotion ? false : { y: 10 }}
        animate={{ y: 0 }}
        className={
          isV3
            ? 'gsv3-consequence-card gsv3-dream-card'
            : 'w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl'
        }
      >
        <div className={isV3 ? 'gsv3-consequence-card__head' : undefined}>
          <p className="text-center text-xs font-bold uppercase tracking-widest text-indigo-600">
            Dream board progress
          </p>
        </div>
        <div className={isV3 ? 'gsv3-consequence-rows !justify-start' : 'mt-4 space-y-3'}>
          {goals.slice(0, 4).map((goal) => (
            <div key={goal.goalId}>
              <div className="mb-1 flex justify-between text-xs text-slate-600">
                <span>{goal.goalName}</span>
                <span className="font-bold text-slate-900">{goal.progressPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
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
