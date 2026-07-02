/**
 * Intern-facing + staff-facing copy for squad XP and pitch scoring.
 */
import { PITCH_PANEL_INVESTMENT_CRITERIA } from './pitchPanelConstants.js';
import {
  MENTOR_REVIEW_DIMENSIONS,
  SQUAD_XP_AUTO_MAX,
  SQUAD_XP_WEEK1_PITCH_MAX,
  SQUAD_XP_WEEK2_PANEL_MAX,
  SQUAD_XP_TOTAL_MAX,
} from './squadXpConstants.js';

/** @deprecated Use PITCH_PANEL_INVESTMENT_CRITERIA */
export const PITCH_PANEL_DIMENSIONS = PITCH_PANEL_INVESTMENT_CRITERIA.map((label, i) => ({
  id: `criterion-${i}`,
  label,
  hint: '',
}));

export { PITCH_PANEL_INVESTMENT_CRITERIA, MENTOR_REVIEW_DIMENSIONS };

/** @type {Array<{ id: string, title: string, detail: string }>} */
export const SQUAD_XP_LAYERS = [
  {
    id: 'auto',
    title: `Mission XP (0–${SQUAD_XP_AUTO_MAX})`,
    detail: 'Shared automatically from interviews, portfolio updates, reflections, and squad participation.',
  },
  {
    id: 'week1-pitch',
    title: `Week 1 pitch (+${SQUAD_XP_WEEK1_PITCH_MAX})`,
    detail: 'Unlocked when the squad completes the Venture Proposition pitch and portfolio save.',
  },
  {
    id: 'week2-panel',
    title: `Demo Day funding (+${SQUAD_XP_WEEK2_PANEL_MAX})`,
    detail: 'Guest investors allocate ₱1,000,000 each across squads. Highest total funding wins — rank maps to squad XP.',
  },
];

export const MENTOR_VS_PANEL_NOTE =
  'Guest investors judge the pitch moment. Your mentor and coach judge the whole week — learning depth, teamwork, professionalism, and build readiness.';

export const SQUAD_XP_TOTAL_LABEL = `${SQUAD_XP_TOTAL_MAX} XP max · shared by every squad member`;
