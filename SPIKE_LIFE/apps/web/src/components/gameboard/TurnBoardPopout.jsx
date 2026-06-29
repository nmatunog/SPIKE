import { motion, useReducedMotion } from 'framer-motion'
import DomainGridBoard from './DomainGridBoard.jsx'
import GameStatusBar from './GameStatusBar.jsx'

function DieFace({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-2xl font-bold text-slate-900 shadow-lg sm:h-16 sm:w-16 sm:text-3xl">
        {value ?? '·'}
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
    </div>
  )
}

export default function TurnBoardPopout({
  visible,
  domains,
  selectedDomainId,
  domainLabel,
  encounter,
  categoryDie,
  situationDie,
  stats,
  onContinue,
}) {
  const reduceMotion = useReducedMotion()
  if (!visible) return null

  const resultLine = encounter?.title
    ? `${domainLabel ?? 'Life'} · ${encounter.title}`
    : domainLabel ?? 'Your year unfolds…'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl"
      >
        {stats && (
          <div className="border-b border-white/10 px-4 py-3">
            <GameStatusBar {...stats} />
          </div>
        )}

        <div className="flex flex-1 flex-col items-center px-4 py-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-300/90">
            This year&apos;s moment
          </p>

          <div className="mt-6 w-full max-w-md">
            <DomainGridBoard
              domains={domains}
              selectedDomainId={selectedDomainId}
              mode="locked"
              className="w-full"
            />
          </div>

          <div className="mt-8 flex items-center gap-8">
            <DieFace value={categoryDie} label="Dice 1 · Category" />
            <DieFace value={situationDie} label="Dice 2 · Situation" />
          </div>

          <p className="mt-6 text-center text-sm font-medium text-slate-300">
            Result: <span className="text-white">{resultLine}</span>
          </p>

          {encounter?.teaser && (
            <p className="mt-3 max-w-lg text-center text-sm leading-relaxed text-slate-400">
              {encounter.teaser}
            </p>
          )}
        </div>

        <div className="border-t border-white/10 px-4 py-4">
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-xl bg-[#8B0000] px-4 py-3 text-sm font-semibold text-white hover:bg-[#6d0000]"
          >
            Face this moment →
          </button>
        </div>
      </motion.div>
    </div>
  )
}
