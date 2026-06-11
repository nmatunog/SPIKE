import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { COACH_SECTIONS } from '../../lib/ventureCoachConstants.js';
import { ROUTES } from '../../routes/paths.js';

/** @param {string} sectionId */
function sectionNeighbors(sectionId) {
  const index = COACH_SECTIONS.findIndex((section) => section.id === sectionId || section.route === sectionId);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? COACH_SECTIONS[index - 1] : null,
    next: index < COACH_SECTIONS.length - 1 ? COACH_SECTIONS[index + 1] : null,
  };
}

/**
 * @param {{ activeSection: string }} props
 */
export function CoachSectionNav({ activeSection }) {
  const { prev, next } = sectionNeighbors(activeSection);
  if (!prev && !next) return null;

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card"
      aria-label="Coach section navigation"
    >
      {prev ? (
        <Link
          to={`${ROUTES.ventureBlueprint}/coach/${prev.route}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-spike"
        >
          <ChevronLeft size={16} />
          {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          to={`${ROUTES.ventureBlueprint}/coach/${next.route}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-spike"
        >
          {next.label}
          <ChevronRight size={16} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
