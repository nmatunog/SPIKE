import ExpandableSideCard from './ExpandableSideCard.jsx'
import { SPACE_TYPE_LEGEND } from './board-legend.js'

export default function BoardLegendCard({ expanded, onToggle }) {
  return (
    <ExpandableSideCard
      id="legend"
      title="Board legend"
      subtitle="Space types"
      preview={
        <div className="mt-1.5 flex flex-wrap gap-1.5 px-0 pb-1">
          {SPACE_TYPE_LEGEND.map((item) => (
            <span
              key={item.type}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              {item.label}
            </span>
          ))}
        </div>
      }
      expanded={expanded}
      onToggle={onToggle}
    >
      <ul className="space-y-2">
        {SPACE_TYPE_LEGEND.map((item) => (
          <li key={item.type} className="flex items-center gap-2 text-xs text-slate-700">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <span className="font-medium">{item.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-snug text-slate-500">
        Dice sets pacing only — each space triggers a financial situation for the decision engine.
      </p>
    </ExpandableSideCard>
  )
}
