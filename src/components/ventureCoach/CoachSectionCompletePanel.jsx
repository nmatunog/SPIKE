import { Pencil } from 'lucide-react';
import { PortfolioEditGraceBanner } from '../portfolio/PortfolioEditGraceBanner.jsx';
import {
  canRefinePortfolioInput,
  isPortfolioInputEditLocked,
} from '../../lib/portfolioEditWindow.js';
import { reopenCoachSectionForRefinement } from '../../lib/ventureCoachService.js';

/**
 * @param {{
 *   participantId: string,
 *   sectionId: string,
 *   title: string,
 *   stored: { completedAt?: string | null, firstCompletedAt?: string | null, refining?: boolean },
 *   onProgress?: () => void,
 *   children: import('react').ReactNode,
 * }} props
 */
export function CoachSectionCompletePanel({
  participantId,
  sectionId,
  title,
  stored,
  onProgress,
  children,
}) {
  const locked = isPortfolioInputEditLocked(stored);
  const canRefine = canRefinePortfolioInput(stored);

  function handleRefine() {
    reopenCoachSectionForRefinement(participantId, sectionId);
    onProgress?.();
  }

  return (
    <section className="space-y-4">
      <PortfolioEditGraceBanner
        completedAt={stored.completedAt}
        firstCompletedAt={stored.firstCompletedAt}
        locked={locked}
      />
      <div className="spike-card space-y-2">
        <p className="font-semibold text-slate-900">{title} — complete ✓</p>
        {children}
        {canRefine ? (
          <button
            type="button"
            onClick={handleRefine}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-spike/30 bg-spike-muted/40 px-4 py-2 text-sm font-semibold text-spike transition hover:border-spike/50 hover:bg-spike-muted/60"
          >
            <Pencil size={16} />
            Refine your answer
          </button>
        ) : null}
      </div>
    </section>
  );
}
