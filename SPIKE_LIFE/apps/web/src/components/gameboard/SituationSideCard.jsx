import ExpandableSideCard from './ExpandableSideCard.jsx'

export default function SituationSideCard({ encounter, expanded, onToggle }) {
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
      accent={encounter ? 'brand' : 'slate'}
    >
      {encounter ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-800">{encounter.teaser}</p>
          <p className="rounded-md bg-white/90 px-2 py-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Teaching focus:</span>{' '}
            {encounter.learningConcept}
          </p>
        </div>
      ) : (
        <p className="text-xs text-slate-500">No active encounter yet.</p>
      )}
    </ExpandableSideCard>
  )
}
