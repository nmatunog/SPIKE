import { Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PortfolioEditGraceBanner } from '../portfolio/PortfolioEditGraceBanner.jsx';
import {
  canRefinePortfolioInput,
  isPortfolioInputEditLocked,
} from '../../lib/portfolioEditWindow.js';
import { COACH_SECTIONS } from '../../lib/ventureCoachConstants.js';
import { reopenCoachSectionForRefinement } from '../../lib/ventureCoachService.js';
import { ROUTES } from '../../routes/paths.js';

/** @param {string} sectionId */
function nextCoachSection(sectionId) {
  const index = COACH_SECTIONS.findIndex((section) => section.id === sectionId);
  if (index < 0 || index >= COACH_SECTIONS.length - 1) return null;
  return COACH_SECTIONS[index + 1];
}

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
  const nextSection = nextCoachSection(sectionId);

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
        {nextSection ? (
          <Link
            to={`${ROUTES.ventureBlueprint}/coach/${nextSection.route}`}
            className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-spike px-4 py-2.5 text-sm font-semibold text-white hover:bg-spike-light sm:w-auto"
          >
            Continue to {nextSection.label} →
          </Link>
        ) : null}
      </div>
    </section>
  );
}
