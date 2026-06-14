import { Pencil } from 'lucide-react';
import { PortfolioEditGraceBanner } from '../portfolio/PortfolioEditGraceBanner.jsx';

/**
 * @param {{
 *   completed: boolean,
 *   editLocked: boolean,
 *   completedAt?: string | null,
 *   firstCompletedAt?: string | null,
 *   canRefine: boolean,
 *   onStartRefine?: () => void,
 *   onComplete: () => void,
 *   completeDisabled?: boolean,
 *   completeLabel: string,
 *   updateLabel?: string,
 *   savedLabel: string,
 * }} props
 */
export function BuilderSubmissionFooter({
  completed,
  editLocked,
  completedAt,
  firstCompletedAt,
  canRefine,
  onStartRefine,
  onComplete,
  completeDisabled = false,
  completeLabel,
  updateLabel = 'Update portfolio',
  savedLabel,
}) {
  if (editLocked) {
    return (
      <div className="space-y-3">
        <PortfolioEditGraceBanner locked />
        <p className="text-sm font-semibold text-slate-600">{savedLabel}</p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="space-y-3">
        <PortfolioEditGraceBanner completedAt={completedAt} firstCompletedAt={firstCompletedAt} />
        <p className="text-sm font-semibold text-emerald-700">{savedLabel}</p>
        {canRefine ? (
          <button
            type="button"
            onClick={onStartRefine}
            className="inline-flex items-center gap-2 rounded-xl border border-spike/30 bg-spike-muted/40 px-4 py-2 text-sm font-semibold text-spike transition hover:border-spike/50 hover:bg-spike-muted/60"
          >
            <Pencil size={16} />
            Refine your answer
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {completedAt ? (
        <PortfolioEditGraceBanner completedAt={completedAt} firstCompletedAt={firstCompletedAt} />
      ) : null}
      <button
        type="button"
        disabled={completeDisabled}
        onClick={onComplete}
        className="spike-btn-primary disabled:opacity-50"
      >
        {completedAt ? updateLabel : completeLabel}
      </button>
    </div>
  );
}
