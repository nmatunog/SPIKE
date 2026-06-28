import { motion, useReducedMotion } from 'framer-motion'

export default function AdvisorInsightPrompt({ visible, onViewAdvice, onDecideMyself }) {
  const reduceMotion = useReducedMotion()
  if (!visible) return null

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute inset-x-0 bottom-6 z-30 flex justify-center px-4 sm:bottom-10"
      role="dialog"
      aria-label="Advisor insight"
    >
      <div className="w-full max-w-md rounded-2xl border border-sky-400/30 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-md">
        <p className="text-label uppercase tracking-wider text-sky-300/90">Advisor</p>
        <p className="mt-2 text-body-lg font-semibold text-white">
          💬 Your advisor has an insight
        </p>
        <p className="mt-1.5 text-body text-slate-300">
          Not every year — but this moment might benefit from a quick FNA perspective before you
          decide.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onViewAdvice}
            className="focus-game-dark flex-1 rounded-xl bg-sky-600 px-4 py-3 text-body font-semibold text-white hover:bg-sky-500"
          >
            View advice
          </button>
          <button
            type="button"
            onClick={onDecideMyself}
            className="focus-game-dark flex-1 rounded-xl border border-slate-500 px-4 py-3 text-body font-semibold text-slate-200 hover:bg-slate-800"
          >
            Decide myself
          </button>
        </div>
      </div>
    </motion.div>
  )
}
