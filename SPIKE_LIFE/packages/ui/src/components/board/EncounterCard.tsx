import { motion } from 'framer-motion'
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
  if (!visible || !encounter) return null

  const categoryDisplay =
    spaceCategoryLabel ??
    (spaceCategory ? spaceCategory.replace('_', ' ') : 'Encounter')

  return (
    <motion.article
      initial={{ opacity: 0, rotateX: -8, y: 16 }}
      animate={{ opacity: 1, rotateX: 0, y: 0 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-slate-600/80 bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl"
      aria-label={`Encounter: ${encounter.title}`}
    >
      <header className="border-b border-slate-700/80 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
          {categoryDisplay}
        </p>
        <h2 className="mt-1 text-xl font-bold text-white md:text-2xl">{encounter.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{encounter.teaser}</p>
      </header>

      {impactTags.length > 0 && (
        <div className="flex flex-wrap gap-2 px-5 py-3">
          {impactTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-700/80 px-3 py-1 text-xs font-medium text-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {priorityLabels.length > 0 && (
        <div className="border-t border-slate-700/60 px-5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Top priorities
          </p>
          <ul className="mt-2 space-y-1.5">
            {priorityLabels.slice(0, 3).map((label, i) => (
              <li key={label} className="flex items-center gap-2 text-sm text-slate-200">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8B0000] text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="flex flex-wrap gap-2 border-t border-slate-700/60 px-5 py-4">
        {onViewAnalysis && (
          <button
            type="button"
            onClick={onViewAnalysis}
            className="flex-1 rounded-xl border border-slate-500 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            View analysis
          </button>
        )}
        {onMakeDecision && (
          <button
            type="button"
            onClick={onMakeDecision}
            className="flex-1 rounded-xl bg-[#8B0000] px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#a50000] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            Make decision
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-lg py-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            Dismiss
          </button>
        )}
      </footer>
    </motion.article>
  )
}

export function EncounterModal(props: EncounterCardProps) {
  return <EncounterCard {...props} />
}
