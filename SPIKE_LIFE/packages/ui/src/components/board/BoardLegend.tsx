import type { BoardLegendProps } from '../../types/component-props.js'

export type { BoardLegendProps, LegendItemViewModel } from '../../types/component-props.js'

export function BoardLegend({
  items,
  compact = false,
  className = '',
  title = 'Spaces',
}: BoardLegendProps) {
  const visible = compact ? items.slice(0, 8) : items

  return (
    <section className={`rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-card ${className}`} aria-label={title}>
      <h3 className="text-label uppercase text-slate-500">{title}</h3>
      <ul className={`mt-2.5 grid gap-1.5 ${compact ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {visible.map((item) => (
          <li key={item.category} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-md shadow-sm ring-1 ring-black/5"
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
