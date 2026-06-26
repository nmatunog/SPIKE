import ExpandableSideCard from './ExpandableSideCard.jsx'

export default function ObjectiveCard({
  expanded,
  onToggle,
  encounter,
  dashboard,
  planView,
}) {
  const topRec = planView?.data?.recommendations?.[0]
  const subtitle = encounter?.learningConcept ?? dashboard?.topPriority ?? 'Roll to begin'
  const summary = topRec
    ? `Focus: ${topRec.label}`
    : 'Land on a space to receive your learning objective for this turn.'

  const objectives = planView?.data?.recommendations?.slice(0, 4) ?? []

  return (
    <ExpandableSideCard
      id="objective"
      title="Current objective"
      subtitle={subtitle}
      summary={summary}
      expanded={expanded}
      onToggle={onToggle}
      accent={encounter ? 'brand' : 'slate'}
    >
      {encounter && (
        <p className="mb-3 text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Encounter:</span> {encounter.title}
          — {encounter.teaser}
        </p>
      )}
      {objectives.length > 0 ? (
        <ol className="space-y-2">
          {objectives.map((rec) => (
            <li key={rec.rank} className="flex gap-2 text-xs text-slate-700">
              <span className="font-bold text-[#8B0000]">{rec.rank}.</span>
              <span>{rec.label}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-slate-500">
          Complete a roll to see recommended priorities for this situation.
        </p>
      )}
    </ExpandableSideCard>
  )
}
