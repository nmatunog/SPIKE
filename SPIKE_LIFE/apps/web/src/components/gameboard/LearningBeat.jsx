import { resolveLearningBeat } from '../../content/learning-beats.js'

const TONE_STYLES = {
  fun: 'border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/80 text-amber-950',
  learn: 'border-sky-200/80 bg-gradient-to-r from-sky-50 to-slate-50 text-sky-950',
  fna: 'border-spike-brand/25 bg-gradient-to-r from-red-50/90 to-white text-spike-ink',
  insight: 'border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50/60 text-emerald-950',
}

export default function LearningBeat({
  phase,
  rolling,
  expandedPanel,
  showEncounterModal,
  roundNumber,
  hasEncounter,
  selectedDomainLabel = null,
  className = '',
}) {
  const beat = resolveLearningBeat({
    phase,
    rolling,
    expandedPanel,
    showEncounterModal,
    roundNumber,
    hasEncounter,
    selectedDomainLabel,
  })

  if (!beat) return null

  return (
    <aside
      className={`rounded-2xl border px-5 py-4 ${TONE_STYLES[beat.tone] ?? TONE_STYLES.learn} ${className}`}
      aria-live="polite"
    >
      <p className="text-label uppercase opacity-70">
        {beat.tone === 'fun' ? 'Your turn' : beat.tone === 'fna' ? 'Advisor method' : 'Learning moment'}
      </p>
      <p className="mt-1 text-title font-semibold">{beat.title}</p>
      <p className="mt-1.5 text-body leading-relaxed opacity-90">{beat.body}</p>
    </aside>
  )
}
