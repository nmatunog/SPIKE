import { CheckCircle2 } from 'lucide-react';

/**
 * @param {{ percent: number, completedItems: number, totalItems: number }} props
 */
export function DayCompletionBar({ percent, completedItems, totalItems }) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-900">
          <CheckCircle2 size={16} /> Day completion
        </span>
        <span className="text-sm font-bold text-emerald-800">
          {completedItems}/{totalItems} items · {percent}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
