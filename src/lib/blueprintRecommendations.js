/**
 * Next recommended action for Venture Blueprint home (Sprint 05).
 */
import { countSubmittedSurveys } from './surveyService.js';
import { countCompletedFnas } from './fnaService.js';
import { computeSectionCompletionPct } from './blueprintCompletion.js';
import { ROUTES } from '../routes/paths.js';

/**
 * @param {ReturnType<import('./participantState.js').buildParticipantState>} state
 * @param {string} participantId
 */
export function getNextBlueprintAction(state, participantId) {
  if (!state.career_track_selected && state.week >= 2) {
    return {
      title: 'Choose your career track',
      detail:
        'You have finished Week 1 orientation. Select Agency Builder or Specialist Consultant to unlock your full Blueprint.',
      href: '/venture-blueprint/overview',
    };
  }

  const sections = [
    { slug: 'vision-purpose', label: 'Ambition & Purpose', path: '/venture-blueprint/vision' },
    { slug: 'venture-coach', label: 'AI Venture Coach', path: '/venture-blueprint/coach' },
    { slug: 'market-intelligence', label: 'Market Intelligence', path: '/venture-blueprint/market-intelligence' },
    { slug: 'client-growth', label: 'Client Growth', path: '/venture-blueprint/client-growth' },
    { slug: 'canvas', label: 'Financial Canvas', path: '/venture-blueprint/canvas' },
  ];

  if (countSubmittedSurveys(participantId) === 0) {
    return {
      title: 'Complete your first survey',
      detail: 'Playbook surveys auto-fill Market Intelligence.',
      href: ROUTES.playbook,
    };
  }

  if (countCompletedFnas(participantId) === 0) {
    return {
      title: 'Run a Financial Needs Analysis',
      detail: 'FNAs populate Client Growth Engine automatically.',
      href: '/venture-blueprint/client-growth',
    };
  }

  for (const section of sections) {
    const pct = computeSectionCompletionPct(section.slug, participantId);
    if (pct < 50) {
      return {
        title: `Strengthen ${section.label}`,
        detail: `${pct}% complete — continue building this section.`,
        href: section.path,
      };
    }
  }

  return {
    title: `Continue Playbook Week ${state.week}`,
    detail: 'Stay on pace with curriculum and field work.',
    href: ROUTES.playbook,
  };
}
