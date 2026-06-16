import { Clock, Lock } from 'lucide-react';
import {
  cohortEditCutoffLabel,
  isWithinCohortEditWindow,
  portfolioEditGraceRemainingLabel,
} from '../../lib/portfolioEditWindow.js';

/**
 * @param {{
 *   completedAt?: string | null,
 *   firstCompletedAt?: string | null,
 *   locked?: boolean,
 * }} props
 */
export function PortfolioEditGraceBanner({ completedAt, firstCompletedAt, locked = false }) {
  if (locked) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <Lock size={18} className="mt-0.5 shrink-0 text-slate-500" aria-hidden />
        <div>
          <p className="font-semibold text-slate-900">Editing closed</p>
          <p className="mt-0.5 text-slate-600">
            {isWithinCohortEditWindow()
              ? `Editing closed after ${cohortEditCutoffLabel()}. Contact your coach if you need changes.`
              : 'Your refinement window has ended. Contact your coach if you need changes.'}
          </p>
        </div>
      </div>
    );
  }

  const remaining = portfolioEditGraceRemainingLabel(completedAt, firstCompletedAt);
  if (!remaining) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <Clock size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
      <div>
        <p className="font-semibold">Refinement window open</p>
        <p className="mt-0.5 text-amber-900/90">
          {isWithinCohortEditWindow() ? (
            <>
              You can refine this until <strong>{cohortEditCutoffLabel()}</strong>
              {remaining ? (
                <>
                  {' '}
                  (about <strong>{remaining}</strong> left)
                </>
              ) : null}
              . After that it locks into your portfolio.
            </>
          ) : (
            <>
              You can refine this for about <strong>{remaining}</strong> more. After that it locks into your
              portfolio.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
