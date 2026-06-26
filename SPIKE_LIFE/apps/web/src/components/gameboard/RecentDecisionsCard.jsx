import ExpandableSideCard from './ExpandableSideCard.jsx'

export default function RecentDecisionsCard({ journeyView, expanded, onToggle }) {
  const timeline = journeyView?.lens === 'journey' ? journeyView.data.timeline : []
  const decisions = timeline.filter((e) => e.kind === 'decision' || e.kind === 'milestone').slice(0, 4)

  return (
    <ExpandableSideCard
      id="recent-decisions"
      title="Recent decisions"
      subtitle={decisions.length ? `${decisions.length} recorded` : 'None yet'}
      preview={
        decisions.length > 0 ? (
          <ul className="mt-1 space-y-1 px-0 pb-1">
            {decisions.slice(0, 2).map((entry) => (
              <li key={entry.id} className="truncate text-[11px] text-slate-700">
                {entry.title}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 px-0 pb-1 text-xs text-slate-500">Complete a turn to build history.</p>
        )
      }
      expanded={expanded}
      onToggle={onToggle}
    >
      {decisions.length > 0 ? (
        <ul className="space-y-2">
          {decisions.map((entry) => (
            <li key={entry.id} className="border-l-2 border-[#8B0000]/40 pl-2 text-xs">
              <p className="font-medium text-slate-900">{entry.title}</p>
              <p className="text-slate-600">{entry.summary}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">Your decision journal appears here.</p>
      )}
    </ExpandableSideCard>
  )
}
