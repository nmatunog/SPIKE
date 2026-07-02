import { CalendarDays, MapPin } from 'lucide-react';
import { formatRaSpikeSessionDate } from '../../lib/programs/ra-spike-session.js';

/**
 * @param {{
 *   label: string,
 *   date: Date | null,
 *   timeLabel: string,
 *   isToday?: boolean,
 *   daysUntil?: number | null,
 *   week: number,
 * }} props
 */
export function RaSpikeNextSessionCard({
  label,
  date,
  timeLabel,
  isToday = false,
  daysUntil = null,
  week,
}) {
  let whenLabel = '';
  if (isToday) {
    whenLabel = 'Today';
  } else if (daysUntil === 1) {
    whenLabel = 'Tomorrow';
  } else if (typeof daysUntil === 'number' && daysUntil > 1) {
    whenLabel = `In ${daysUntil} days`;
  } else if (daysUntil != null && daysUntil < 0) {
    whenLabel = 'Completed';
  }

  return (
    <section className="spike-card space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="shrink-0 text-spike" size={20} aria-hidden />
        <p className="text-sm font-semibold text-slate-900">Next classroom session</p>
      </div>

      <div>
        <p className="text-lg font-bold text-slate-900">{label}</p>
        <p className="mt-1 text-sm text-slate-600">{formatRaSpikeSessionDate(date)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={14} aria-hidden className="text-slate-400" />
          {timeLabel}
        </span>
        {whenLabel ? (
          <span
            className={`rounded-full px-2.5 py-0.5 text-2xs font-semibold ${
              isToday ? 'bg-spike text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {whenLabel}
          </span>
        ) : null}
      </div>

      <p className="text-xs text-slate-500">
        Week {week} · In-person cohort workshop (~3 hours)
      </p>
    </section>
  );
}
