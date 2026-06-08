import { CheckCircle2, Circle, Clock } from 'lucide-react';

/**
 * @param {{
 *   items: Array<{ key: string, label: string, hour?: number, done?: boolean, description?: string }>,
 *   currentHours: number,
 * }} props
 */
export function VentureTimeline({ items, currentHours }) {
  return (
    <ol className="relative space-y-0 border-l-2 border-spike/20 pl-6">
      {items.map((item, index) => {
        const Icon = item.done ? CheckCircle2 : currentHours >= (item.hour ?? 0) ? Clock : Circle;
        const tone = item.done
          ? 'text-emerald-600'
          : currentHours >= (item.hour ?? 0)
            ? 'text-spike'
            : 'text-slate-300';

        return (
          <li key={item.key} className="relative pb-8 last:pb-0">
            <span
              className={`absolute -left-[1.65rem] flex h-7 w-7 items-center justify-center rounded-full bg-white ring-2 ring-spike/10 ${tone}`}
            >
              <Icon size={14} />
            </span>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold text-slate-900">{item.label}</h4>
                {item.hour != null ? (
                  <span className="text-2xs font-bold uppercase tracking-wide text-slate-400">
                    ~{item.hour}h
                  </span>
                ) : null}
              </div>
              {item.description ? <p className="mt-1 text-sm text-slate-600">{item.description}</p> : null}
              {index === items.findIndex((m) => !m.done) ? (
                <p className="mt-2 text-xs font-semibold text-spike">You are here</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
