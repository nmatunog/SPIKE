import { motion, useReducedMotion } from 'framer-motion'
import ExpandableSideCard from './ExpandableSideCard.jsx'

export default function SituationSideCard({ encounter, expanded, onToggle, forceOpen = false }) {
  const reduceMotion = useReducedMotion()

  return (
    <ExpandableSideCard
      id="situation"
      title="This turn's moment"
      subtitle={encounter?.title ?? 'Your story starts with a year'}
      summary={
        encounter?.teaser ??
        'Tap Next Year — a domain lights up, a situation appears, then you plan through it like an advisor.'
      }
      expanded={expanded}
      onToggle={onToggle}
      forceOpen={forceOpen}
      accent={encounter ? 'brand' : 'slate'}
    >
      {encounter ? (
        <motion.div
          key={encounter.id ?? encounter.title}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <p className="text-body-lg leading-relaxed text-slate-800">{encounter.teaser}</p>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/90 px-4 py-4">
            <p className="text-label uppercase text-amber-800/80">Why this matters</p>
            <p className="mt-2 text-body leading-relaxed text-amber-950">{encounter.learningConcept}</p>
          </div>
          <p className="text-caption text-slate-500">
            Next: open your FNA analysis to see how advisors would prioritize this moment.
          </p>
        </motion.div>
      ) : (
        <p className="text-body text-slate-600">
          Tap Next Year when you are ready. Every year is a chapter in your financial life.
        </p>
      )}
    </ExpandableSideCard>
  )
}
