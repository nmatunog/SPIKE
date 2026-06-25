/** Week 2 Market Validation Pitch — guest panel scoring. */

export const PITCH_PANEL_SESSION_ID = 'segment-1-week-2';
export const PITCH_PANEL_ACCESS_PIN = 'W2PITCH';
export const PITCH_PANEL_WEEK = 2;

/** @type {Array<{ id: string, label: string, hint: string }>} */
export const PITCH_PANEL_DIMENSIONS = [
  { id: 'evidence', label: 'Evidence quality', hint: 'Customer quotes, interview depth, data not opinions' },
  { id: 'validation', label: 'Problem validation', hint: 'Clear belief shift — what they thought vs learned' },
  { id: 'presentation', label: 'Presentation', hint: 'Clarity, structure, professionalism, time' },
  { id: 'team', label: 'Team delivery', hint: 'Shared ownership, coherent squad story' },
];

export const PITCH_PANEL_LIVE_STORAGE_KEY = 'spike_pitch_panel_live_v1';
export const PITCH_PANEL_FINAL_STORAGE_KEY = 'spike_pitch_panel_final_v1';
export const PITCH_PANEL_TOKEN_STORAGE_KEY = 'spike_pitch_panel_token_v1';
