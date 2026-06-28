import { motion, useReducedMotion } from 'framer-motion'
import { fadeScale } from '../../motion/variants.js'
import type { EncounterCardProps } from '../../types/component-props.js'

export type { EncounterCardProps }

export function EncounterCard({
  encounter,
  spaceCategory,
  spaceCategoryLabel,
  impactTags = [],
  priorityLabels = [],
  visible = true,
  onViewAnalysis,
  onMakeDecision,
  onDismiss,
}: EncounterCardProps) {
  const reduceMotion = useReducedMotion()

  if (!visible || !encounter) return null

  const categoryDisplay =
    spaceCategoryLabel ??
    (spaceCategory ? spaceCategory.replace(/_/g, ' ') : 'Life event')

  return (
    <motion.article
      variants={reduceMotion ? undefined : fadeScale}
      initial={reduceMotion ? { opacity: 0 } : 'hidden'}
      animate={reduceMotion ? { opacity: 1 } : 'visible'}
      exit={reduceMotion ? { opacity: 0 } : 'exit'}
      className="overflow-hidden rounded-2xl border border-slate-600/70 bg-gradient-to-b from-slate-800 to-slate-950 shadow-2xl"
      aria-label={`Encounter: ${encounter.title}`}
    >
      <header className="border-b border-slate-700/70 px-6 py-6">
        <p className="text-label uppercase text-amber-300/90">{categoryDisplay}</p>
        <h2 className="mt-2 text-display-sm font-bold tracking-tight text-white">{encounter.title}</h2>
        <p className="mt-3 text-body-lg leading-relaxed text-slate-200">{encounter.teaser}</p>
      </header>

      {encounter.learningConcept && (
        <div className="border-b border-slate-700/60 bg-slate-900/50 px-6 py-4">
          <p className="text-label uppercase text-slate-400">You will discover</p>
          <p className="mt-2 text-body leading-relaxed text-slate-100">{encounter.learningConcept}</p>
        </div>
      )}

      {impactTags.length > 0 && (
        <div className="flex flex-wrap gap-2 px-6 py-4">
          {impactTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-700/70 px-3 py-1 text-caption font-medium text-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {priorityLabels.length > 0 && (
        <div className="border-t border-slate-700/60 px-6 py-4">
          <p className="text-label uppercase text-slate-400">FNA suggests focusing on</p>
          <ul className="mt-3 space-y-2">
            {priorityLabels.slice(0, 3).map((label, i) => (
              <li key={label} className="flex items-center gap-3 text-body text-slate-200">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spike-brand text-caption font-bold text-white">
                  {i + 1}
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="flex flex-col gap-2 border-t border-slate-700/60 px-6 py-5 sm:flex-row">
        {onViewAnalysis && (
          <button
            type="button"
            onClick={onViewAnalysis}
            className="focus-game-dark flex-1 rounded-xl border border-slate-500 bg-slate-800 px-4 py-3.5 text-body font-semibold text-white transition hover:bg-slate-700"
          >
            Open FNA analysis
          </button>
        )}
        {onMakeDecision && (
          <button
            type="button"
            onClick={onMakeDecision}
            className="focus-game-dark flex-1 rounded-xl bg-spike-brand px-4 py-3.5 text-body font-bold text-white shadow-lg transition hover:bg-spike-brand-hover"
          >
            Choose your strategy
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="focus-game-dark w-full rounded-xl py-2 text-caption text-slate-400 hover:text-slate-200 sm:order-first sm:w-auto sm:px-2"
          >
            Not now
          </button>
        )}
      </footer>
    </motion.article>
  )
}

export function EncounterModal(props: EncounterCardProps) {
  return <EncounterCard {...props} />
}
