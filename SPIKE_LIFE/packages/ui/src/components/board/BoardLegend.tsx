import type { BoardLegendProps } from '../../types/component-props.js'

export type { BoardLegendProps, LegendItemViewModel } from '../../types/component-props.js'

export function BoardLegend({
  items,
  compact = false,
  className = '',
  title = 'Board legend',
}: BoardLegendProps) {
  const visible = compact ? items.slice(0, 8) : items

  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ${className}`}
      aria-label={title}
    >
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</h3>
      <ul className={`mt-3 grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {visible.map((item) => (
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
