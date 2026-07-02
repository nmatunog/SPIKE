import { Check, ChevronRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_STYLES = {
  not_started: 'border-slate-200 bg-white',
  in_progress: 'border-amber-200 bg-amber-50/50',
  complete: 'border-emerald-200 bg-emerald-50/40',
};

/**
 * @param {{
 *   index: number,
 *   stepId: string,
 *   label: string,
 *   summary?: string,
 *   status?: 'not_started' | 'in_progress' | 'complete',
 *   locked?: boolean,
 *   href?: string,
 *   onOpen?: () => void,
 * }} props
 */
export function WeeklyCard({
  index,
  stepId,
  label,
  summary = '',
  status = 'not_started',
  locked = false,
  href,
  onOpen,
}) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.not_started;
  const complete = status === 'complete';

  const inner = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          complete ? 'bg-emerald-600 text-white' : locked ? 'bg-slate-100 text-slate-400' : 'bg-spike-muted text-spike'
        }`}
      >
        {complete ? <Check size={18} aria-hidden /> : locked ? <Lock size={16} aria-hidden /> : index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{label}</p>
        {summary ? <p className="mt-0.5 text-sm text-slate-600 line-clamp-2">{summary}</p> : null}
        {status === 'in_progress' ? (
          <p className="mt-1 text-2xs font-semibold uppercase tracking-wide text-amber-800">In progress</p>
        ) : null}
      </div>
      {!locked ? <ChevronRight className="shrink-0 text-slate-400" size={20} aria-hidden /> : null}
    </>
  );

  const className = `spike-card flex items-start gap-4 transition ${style} ${
    locked ? 'opacity-60' : 'hover:border-spike/30 hover:shadow-sm'
  }`;

  if (locked) {
    return (
      <li className={className} aria-disabled="true">
        {inner}
      </li>
    );
  }

  if (href) {
    return (
      <li>
        <Link to={href} className={`block ${className}`} data-step={stepId}>
          {inner}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button type="button" className={`w-full text-left ${className}`} onClick={onOpen} data-step={stepId}>
        {inner}
      </button>
    </li>
  );
}
