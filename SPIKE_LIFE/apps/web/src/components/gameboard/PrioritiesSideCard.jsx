import ExpandableSideCard from './ExpandableSideCard.jsx'

function PriorityBadge({ priority }) {
  const colors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${colors[priority] ?? colors.low}`}>
      {priority}
    </span>
  )
}

export default function PrioritiesSideCard({ planView, expanded, onToggle }) {
  const recs = planView?.data?.recommendations ?? []
  const fna = planView?.data?.fna
  return (
    <ExpandableSideCard
      id="priorities"
      title="Recommended priorities"
      subtitle={fna ? `FNA ${fna.overallScore} — ${fna.rating}` : 'FNA pending'}
      preview={
        recs.length > 0 ? (
          <ol className="mt-1.5 space-y-1 px-0 pb-1">
            {recs.slice(0, 3).map((r) => (
              <li key={r.rank} className="flex gap-1.5 text-[11px] text-slate-700">
                <span className="font-bold text-[#8B0000]">{r.rank}.</span>
                <span className="line-clamp-1">{r.label}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-1 px-0 pb-1 text-xs text-slate-500">Roll to reveal priorities.</p>
        )
      }
      expanded={expanded}
      onToggle={onToggle}
      accent={recs.length ? 'brand' : 'slate'}
    >
      {fna && (
        <div className="mb-3 rounded-md border border-slate-100 bg-slate-50 px-2 py-2">
          <p className="text-xs font-semibold text-slate-800">FNA snapshot</p>
          <p className="mt-1 text-xs text-slate-600">
            Top priority: <span className="font-medium">{fna.topPriority}</span>
          </p>
          <ul className="mt-2 space-y-1">
            {fna.gaps.slice(0, 3).map((gap) => (
              <li key={gap.dimension} className="flex items-start justify-between gap-1 text-[11px]">
                <span className="text-slate-700">{gap.summary}</span>
                <PriorityBadge priority={gap.priority} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {recs.length > 0 ? (
        <ol className="space-y-2">
          {recs.map((rec) => (
            <li key={rec.rank} className="rounded-md border border-slate-100 bg-white px-2 py-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-slate-900">
                  {rec.rank}. {rec.label}
                </span>
                <PriorityBadge priority={rec.priority} />
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-slate-600">{rec.rationale}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-slate-500">Recommendations appear once a situation is active.</p>
      )}
    </ExpandableSideCard>
  )
}
