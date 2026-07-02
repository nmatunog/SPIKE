import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { ROUTES } from '../../routes/paths.js';

const STATUS_LABELS = {
  not_started: { text: 'Not started', className: 'bg-slate-100 text-slate-700' },
  in_progress: { text: 'In progress', className: 'bg-amber-50 text-amber-900' },
  complete: { text: 'Complete', className: 'bg-emerald-50 text-emerald-800' },
};

/**
 * @param {{
 *   title: string,
 *   summary: string,
 *   dueHint: string,
 *   estimatedMinutes: number,
 *   status?: 'not_started' | 'in_progress' | 'complete',
 * }} props
 */
export function RaSpikeAssignmentCard({
  title,
  summary,
  dueHint,
  estimatedMinutes,
  status = 'not_started',
}) {
  const badge = STATUS_LABELS[status] ?? STATUS_LABELS.not_started;

  return (
    <section className="spike-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="shrink-0 text-spike" size={20} aria-hidden />
          <p className="text-sm font-semibold text-slate-900">This week&apos;s assignment</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-2xs font-semibold ${badge.className}`}>
          {badge.text}
        </span>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{summary}</p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>{dueHint}</span>
        <span>~{estimatedMinutes} min</span>
      </div>

      <Link
        to={ROUTES.raSpikePlaybook}
        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-spike hover:underline"
      >
        Open in Playbook
        <ArrowRight size={16} aria-hidden />
      </Link>
    </section>
  );
}
