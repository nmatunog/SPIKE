import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import DomainGridBoard from './DomainGridBoard.jsx'

const TIMING = {
  domainLockMs: 450,
  loadingMs: 400,
  shuffleStepMs: 110,
  expandMs: 380,
}

function SituationShuffleCard({ title, active, reduceMotion }) {
  return (
    <motion.div
      animate={{
        scale: active ? 1.02 : 0.94,
        opacity: active ? 1 : 0.35,
        y: active ? 0 : 6,
      }}
      transition={{ duration: reduceMotion ? 0 : 0.12 }}
      className={`rounded-2xl border px-5 py-4 text-center ${
        active
          ? 'border-red-400/50 bg-gradient-to-b from-slate-800 to-slate-900 shadow-xl shadow-red-950/30'
          : 'border-white/10 bg-slate-900/50'
      }`}
    >
      <p className="text-label uppercase tracking-wider text-slate-500">Situation</p>
      <p className="mt-2 text-title font-bold text-white">{title}</p>
    </motion.div>
  )
}

export default function YearRevealSequence({
  active = false,
  pending = false,
  domains = [],
  animationCycle = [],
  reveal = null,
  onComplete,
}) {
  const reduceMotion = useReducedMotion()
  const [phase, setPhase] = useState('finding')
  const [shuffleIndex, setShuffleIndex] = useState(0)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!active) {
      setPhase('finding')
      setShuffleIndex(0)
      completedRef.current = false
      return undefined
    }

    if (pending || !reveal) {
      setPhase('finding')
      return undefined
    }

    let cancelled = false
    const timers = []

    const schedule = (ms, fn) => {
      const id = setTimeout(() => {
        if (!cancelled) fn()
      }, ms)
      timers.push(id)
    }

    setPhase('domain-lock')
    schedule(TIMING.domainLockMs, () => setPhase('loading-situation'))
    schedule(TIMING.domainLockMs + TIMING.loadingMs, () => setPhase('situation-shuffle'))

    const shuffleStart = TIMING.domainLockMs + TIMING.loadingMs
    const shuffleCards = reveal.situationShuffle ?? []
    const shuffleDuration = shuffleCards.length * TIMING.shuffleStepMs

    shuffleCards.forEach((_, index) => {
      schedule(shuffleStart + index * TIMING.shuffleStepMs, () => setShuffleIndex(index))
    })

    schedule(shuffleStart + shuffleDuration + 80, () => setPhase('expand'))
    schedule(
      shuffleStart + shuffleDuration + 80 + TIMING.expandMs,
      () => {
        if (!cancelled && !completedRef.current) {
          completedRef.current = true
          onComplete?.()
        }
      },
    )

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [active, pending, reveal, onComplete])

  if (!active) return null

  const domainLabel = reveal?.domainLabel ?? '…'
  const encounter = reveal?.encounter ?? null
  const shuffleCards = reveal?.situationShuffle ?? []
  const currentShuffle = shuffleCards[shuffleIndex] ?? encounter

  const statusLine = (() => {
    if (phase === 'finding') return 'Let\'s see what life brings you this year…'
    if (phase === 'domain-lock') return domainLabel
    if (phase === 'loading-situation') return `Loading ${domainLabel} situation…`
    if (phase === 'situation-shuffle') return currentShuffle?.title ?? domainLabel
    if (phase === 'expand') return encounter?.title ?? 'Your moment'
    return ''
  })()

  const gridMode =
    phase === 'finding' ? 'scanning' : phase === 'domain-lock' ? 'locked' : 'idle'

  const showGrid = phase === 'finding' || phase === 'domain-lock'
  const showShuffle = phase === 'loading-situation' || phase === 'situation-shuffle'
  const showExpand = phase === 'expand' && encounter

  return (
    <div
      className="flex w-full max-w-lg flex-col items-center"
      role="status"
      aria-live="polite"
      aria-busy={phase !== 'expand'}
    >
      <motion.p
        key={statusLine}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 min-h-[1.5rem] text-center text-label uppercase tracking-wider text-amber-300/90"
      >
        {statusLine}
      </motion.p>

      <AnimatePresence mode="wait">
        {showGrid && (
          <motion.div
            key="grid"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            <DomainGridBoard
              domains={domains}
              selectedDomainId={reveal?.domainId ?? null}
              animationCycle={animationCycle}
              mode={gridMode}
              rolling={phase === 'finding'}
              className="w-full"
            />
          </motion.div>
        )}

        {showShuffle && (
          <motion.div
            key="shuffle"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            className="w-full"
          >
            <SituationShuffleCard
              title={phase === 'loading-situation' ? '…' : (currentShuffle?.title ?? '…')}
              active
              reduceMotion={reduceMotion}
            />
          </motion.div>
        )}

        {showExpand && (
          <motion.article
            key="expand"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="w-full overflow-hidden rounded-3xl border border-red-400/40 bg-gradient-to-b from-slate-800 to-slate-950 shadow-2xl shadow-red-950/40"
          >
            <header className="border-b border-slate-700/70 px-6 py-6">
              <p className="text-label uppercase text-amber-300/90">{domainLabel}</p>
              <h2 className="mt-2 text-display-sm font-bold text-white">{encounter.title}</h2>
              <p className="mt-3 text-body-lg leading-relaxed text-slate-200">{encounter.teaser}</p>
            </header>
            {encounter.learningConcept && (
              <div className="px-6 py-4">
                <p className="text-label uppercase text-slate-400">You will discover</p>
                <p className="mt-2 text-body text-slate-100">{encounter.learningConcept}</p>
              </div>
            )}
          </motion.article>
        )}
      </AnimatePresence>
    </div>
  )
}
