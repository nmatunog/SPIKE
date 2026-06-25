/** Squad-first assessment — shared weekly XP (0–100). */

export const SQUAD_XP_AUTO_MAX = 80;
/** Auto-awarded when the squad completes the Week 1 Venture Proposition pitch. */
export const SQUAD_XP_WEEK1_PITCH_MAX = 20;
/** @deprecated Alias */
export const SQUAD_XP_PITCH_BONUS_MAX = SQUAD_XP_WEEK1_PITCH_MAX;
/** Week 2 market validation pitch — guest panel average mapped 0–20. */
export const SQUAD_XP_WEEK2_PANEL_MAX = 20;
/** @deprecated Use SQUAD_XP_WEEK1_PITCH_MAX */
export const SQUAD_XP_MENTOR_MAX = SQUAD_XP_WEEK1_PITCH_MAX;
export const SQUAD_XP_TOTAL_MAX = 120;

export const MAX_COMMENDATIONS_PER_SQUAD = 3;

/** @type {Array<{ id: string, label: string, emoji: string }>} */
export const COMMENDATION_TYPES = [
  { id: 'leadership', label: 'Leadership', emoji: '🏅' },
  { id: 'best_interview', label: 'Best Interview', emoji: '🏅' },
  { id: 'curiosity', label: 'Outstanding Curiosity', emoji: '🏅' },
  { id: 'team_player', label: 'Team Player', emoji: '🏅' },
  { id: 'research_champion', label: 'Research Champion', emoji: '🏅' },
  { id: 'portfolio_excellence', label: 'Portfolio Excellence', emoji: '🏅' },
  { id: 'mentors_choice', label: "Mentor's Choice", emoji: '🏅' },
];

/** @type {Array<{ id: string, label: string }>} */
export const MENTOR_REVIEW_DIMENSIONS = [
  { id: 'quality_of_learning', label: 'Quality of Learning' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'professionalism', label: 'Professionalism' },
  { id: 'readiness_for_stage_gate', label: 'Readiness for Stage Gate' },
];

/** @type {Array<{ id: 'not_ready' | 'almost_ready' | 'ready', label: string, color: string }>} */
export const STAGE_GATE_DECISIONS = [
  { id: 'not_ready', label: 'Not Ready', color: 'red' },
  { id: 'almost_ready', label: 'Almost Ready', color: 'amber' },
  { id: 'ready', label: 'Ready', color: 'green' },
];

/** Auto XP weights (sum = 80) */
export const AUTO_XP_WEIGHTS = {
  interviews: 15,
  playbook: 10,
  portfolio: 10,
  reflection: 10,
  assignment: 10,
  attendance: 10,
  participation: 10,
  stageGatePrep: 5,
};
