/**
 * Intern-facing + staff-facing copy for squad XP and pitch scoring.
 */
import { PITCH_PANEL_DIMENSIONS } from './pitchPanelConstants.js';
import {
  MENTOR_REVIEW_DIMENSIONS,
  SQUAD_XP_AUTO_MAX,
  SQUAD_XP_WEEK1_PITCH_MAX,
  SQUAD_XP_WEEK2_PANEL_MAX,
  SQUAD_XP_TOTAL_MAX,
} from './squadXpConstants.js';

export { PITCH_PANEL_DIMENSIONS, MENTOR_REVIEW_DIMENSIONS };

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
    title: `Guest panel (+${SQUAD_XP_WEEK2_PANEL_MAX})`,
    detail: 'External panelists score your Friday pitch on four quick dimensions (1–5 each). Faculty finalizes the average into squad XP.',
  },
];

export const MENTOR_VS_PANEL_NOTE =
  'Guest panelists judge the pitch moment. Your mentor and coach judge the whole week — learning depth, teamwork, professionalism, and build readiness.';

export const SQUAD_XP_TOTAL_LABEL = `${SQUAD_XP_TOTAL_MAX} XP max · shared by every squad member`;
