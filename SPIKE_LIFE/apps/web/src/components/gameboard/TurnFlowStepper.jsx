import { motion, LayoutGroup, useReducedMotion } from 'framer-motion'
import { YEAR_LOOP_STEPS } from '../../content/learning-beats.js'

const ICONS = {
  year: '📅',
  domain: '◈',
  situation: '!',
  generate: '✦',
  analysis: '📊',
  decision: '✓',
  immediate: '⚡',
  hidden: '🌱',
  advance: '→',
}

const STEPS = Object.entries(YEAR_LOOP_STEPS).map(([id, step]) => ({
  id,
  ...step,
  short: step.label,
  icon: ICONS[id] ?? '•',
}))

function resolveActiveStep({
  phase,
  rolling,
  expandedPanel,
  showEncounterModal,
}) {
  if (rolling) return 'domain'
  if (expandedPanel === 'reflect') return 'hidden'
  if (expandedPanel === 'decision') return 'decision'
  if (expandedPanel === 'fna') return 'analysis'
  if (phase === 'decision_phase' || showEncounterModal) return 'generate'
  if (phase === 'turn_complete') return 'advance'
  if (phase === 'category_rolled') return 'situation'
  if (phase === 'ready_to_roll') return 'year'
  return 'year'
}

function VerticalStepper({ active, activeIndex, reduceMotion }) {
  return (
    <LayoutGroup>
      <ol className="relative mt-4 max-h-[min(52vh,28rem)] space-y-2 overflow-y-auto pr-1">
        {STEPS.map((step, index) => {
          const isActive = step.id === active
          const isDone = index < activeIndex
          return (
            <li key={step.id} className="relative">
              {index < STEPS.length - 1 && (
                <span
                  className={`absolute left-[1.4rem] top-12 h-[calc(100%+0.25rem)] w-0.5 ${
                    isDone ? 'bg-emerald-300' : 'bg-slate-200'
                  }`}
                  aria-hidden
                />
              )}
              <StepRow step={step} isActive={isActive} isDone={isDone} reduceMotion={reduceMotion} />
            </li>
          )
        })}
      </ol>
    </LayoutGroup>
  )
}

function HorizontalStepper({ active, activeIndex, reduceMotion }) {
  return (
    <ol className="flex items-stretch gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {STEPS.map((step, index) => {
        const isActive = step.id === active
        const isDone = index < activeIndex
        return (
          <li key={step.id} className="min-w-[4.5rem] flex-1">
            <StepRow step={step} isActive={isActive} isDone={isDone} reduceMotion={reduceMotion} compact />
          </li>
        )
      })}
    </ol>
  )
}

function StepRow({ step, isActive, isDone, reduceMotion, compact = false }) {
  return (
    <motion.div
      layout={!reduceMotion}
      animate={{ opacity: isActive ? 1 : isDone ? 0.82 : 0.4 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-xl ${
        compact ? 'flex flex-col items-center px-1 py-2 text-center' : 'px-3.5 py-3'
      } ${isActive ? 'bg-spike-brand-muted ring-1 ring-spike-brand/20' : ''}`}
      aria-current={isActive ? 'step' : undefined}
    >
      <div className={`flex items-center gap-3 ${compact ? 'flex-col gap-1.5' : ''}`}>
        <motion.span
          animate={
            isActive && !reduceMotion
              ? { scale: [1, 1.06, 1], transition: { duration: 0.28 } }
              : { scale: 1 }
          }
          className={`relative z-10 flex shrink-0 items-center justify-center rounded-xl font-medium ${
            compact ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-base'
          } ${
            isActive
              ? 'bg-spike-brand text-white shadow-sm'
              : isDone
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
          }`}
          aria-hidden
        >
          {isDone && !isActive ? '✓' : step.icon}
        </motion.span>
        <div className={compact ? '' : 'min-w-0 flex-1'}>
          <span
            className={`block font-semibold ${compact ? 'text-[0.625rem] leading-tight' : 'text-body'} ${
              isActive ? 'text-spike-ink' : 'text-slate-600'
            }`}
          >
            {compact ? step.short : step.label}
          </span>
          {!compact && isActive && (
            <span className="mt-0.5 block text-caption text-slate-500">{step.hint}</span>
          )}
        </div>
      </div>
      {!compact && isActive && (
        <p className="relative z-10 mt-2 border-t border-spike-brand/10 pt-2 text-caption leading-snug text-slate-600">
          {step.learn}
        </p>
      )}
    </motion.div>
  )
}

export default function TurnFlowStepper({
  phase = 'ready_to_roll',
  rolling = false,
  expandedPanel = null,
  showEncounterModal = false,
  layout = 'vertical',
  className = '',
}) {
  const reduceMotion = useReducedMotion()
  const active = resolveActiveStep({
    phase,
    rolling,
    expandedPanel,
    showEncounterModal,
  })
  const activeIndex = STEPS.findIndex((s) => s.id === active)

  if (layout === 'horizontal') {
    return (
      <nav className={className} aria-label="Year loop">
        <HorizontalStepper active={active} activeIndex={activeIndex} reduceMotion={reduceMotion} />
      </nav>
    )
  }

  return (
    <nav className={`game-card-elevated px-5 py-5 ${className}`} aria-label="Year loop">
      <p className="text-label uppercase text-slate-500">How a year works</p>
      <p className="mt-1 text-caption text-slate-500">
        Next year → domains animate → situation → one decision → consequences.
      </p>
      <VerticalStepper active={active} activeIndex={activeIndex} reduceMotion={reduceMotion} />
    </nav>
  )
}
