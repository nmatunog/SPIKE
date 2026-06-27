import ExpandableSideCard from './ExpandableSideCard.jsx'

export default function SituationSideCard({ encounter, expanded, onToggle, forceOpen = false }) {
  return (
    <ExpandableSideCard
      id="situation"
      title="Situation"
      subtitle={encounter?.title ?? 'Awaiting roll'}
      summary={
        encounter?.teaser ?? 'Roll the dice to land on a space and reveal your financial situation.'
      }
      expanded={expanded}
      onToggle={onToggle}
      forceOpen={forceOpen}
      accent={encounter ? 'brand' : 'slate'}
    >
      {encounter ? (
        <div className="space-y-3">
          <p className="text-body-lg leading-relaxed text-slate-800">{encounter.teaser}</p>
          <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-body text-slate-600 ring-1 ring-slate-200/80">
            <span className="font-semibold text-slate-900">Teaching focus:</span>{' '}
            {encounter.learningConcept}
          </p>
        </div>
      ) : (
        <p className="text-body text-slate-500">Roll the dice to begin your turn.</p>
      )}
    </ExpandableSideCard>
  )
}
