import ExpandableSideCard from './ExpandableSideCard.jsx'

export default function FnaSummaryCard({ planView, expanded, onToggle }) {
  const fna = planView?.lens === 'plan' ? planView.data.fna : null
  const recs = planView?.lens === 'plan' ? planView.data.recommendations : []

  const highlights = fna
    ? [
        { label: 'Top priority', value: fna.topPriority, tone: 'high' },
        { label: 'FNA rating', value: fna.rating, tone: 'neutral' },
        { label: 'Overall score', value: `${fna.overallScore}`, tone: 'neutral' },
      ]
    : []

  return (
    <ExpandableSideCard
      id="fna-summary"
      title="FNA summary"
      subtitle={fna ? `Score ${fna.overallScore} — ${fna.rating}` : 'Pending roll'}
      preview={
        fna ? (
          <ul className="mt-1 space-y-1 px-0 pb-1">
            {highlights.map((h) => (
              <li key={h.label} className="text-[11px] text-slate-600">
                <span className="text-slate-400">{h.label}:</span> {h.value}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 px-0 pb-1 text-xs text-slate-500">Roll to generate FNA.</p>
        )
      }
      expanded={expanded}
      onToggle={onToggle}
      accent={fna ? 'brand' : 'slate'}
    >
      {fna && (
        <ul className="space-y-2">
          {fna.gaps.slice(0, 4).map((gap) => (
            <li key={gap.dimension} className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5 text-[11px]">
              <span className="font-medium text-slate-800">{gap.dimensionLabel}</span>
              <p className="text-slate-600">{gap.summary}</p>
            </li>
          ))}
        </ul>
      )}
      {recs.length > 0 && (
        <p className="mt-2 text-[10px] text-slate-500">
          See Priorities card for ranked actions.
        </p>
      )}
    </ExpandableSideCard>
  )
}
