import { labelFor } from '../../lib/ventureCoachEngine.js';

/**
 * @param {{
 *   items: string[],
 *   options: Array<{ id: string, label: string }>,
 *   onChange: (items: string[]) => void,
 *   title?: string,
 * }} props
 */
export function CoachRankList({ items, options, onChange, title = 'Use arrows to rank — #1 matters most' }) {
  function move(idx, direction) {
    const next = [...items];
    const target = idx + direction;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">{title}</p>
      <ol className="space-y-2">
        {items.map((id, idx) => (
          <li
            key={id}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <span className="text-sm font-semibold text-slate-800">
              {idx + 1}. {labelFor(id, options)}
            </span>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                disabled={idx === 0}
                aria-label="Move up"
                onClick={() => move(idx, -1)}
                className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-xl border border-slate-200 text-base font-semibold text-slate-600 hover:border-spike/40 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={idx === items.length - 1}
                aria-label="Move down"
                onClick={() => move(idx, 1)}
                className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-xl border border-slate-200 text-base font-semibold text-slate-600 hover:border-spike/40 disabled:opacity-30"
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * @param {{ count: number, exact?: number, max?: number, label?: string }} props
 */
export function CoachSelectionCounter({ count, exact, max, label = 'Selected' }) {
  if (exact) {
    const complete = count === exact;
    return (
      <p className={`text-sm font-semibold ${complete ? 'text-emerald-700' : 'text-spike'}`}>
        {count} of {exact} {label}
        {complete ? ' ✓' : ''}
      </p>
    );
  }

  return (
    <p className="text-sm font-semibold text-slate-600">
      {count}
      {max ? ` / ${max}` : ''} {label}
    </p>
  );
}
