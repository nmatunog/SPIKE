import { SPACE_CATEGORY_LEGEND } from '../config/default-board.js'

export interface BoardLegendProps {
  compact?: boolean
  className?: string
}

export function BoardLegend({ compact = false, className = '' }: BoardLegendProps) {
  const items = compact ? SPACE_CATEGORY_LEGEND.slice(0, 8) : SPACE_CATEGORY_LEGEND

  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ${className}`}
      aria-label="Board legend"
    >
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Board legend</h3>
      <ul className={`mt-3 grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {items.map((item) => (
          <li key={item.category} className="flex items-center gap-2.5 text-sm">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-md shadow-sm"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <span className="font-medium text-slate-700">{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
