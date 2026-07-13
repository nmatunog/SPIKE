import {
  WEEK5_DAY2_PANEL_QUESTIONS_DEFAULT,
  WEEK5_DAY2_PITCH_SECTIONS_DEFAULT,
  WEEK5_DAY2_READINESS_ITEMS,
} from '../week5Day1/missionConstants.js';

export const WEEK5_DAY2_STORAGE_KEY = 'spike_week5_day2_mission_v1';

/** @typedef {{ id: string, title: string, purpose: string, keyMessage: string, evidence: string, keyNumber: string, speaker: string, durationMin: string, visualIdea: string, sourceSection: string, notes: string, hidden?: boolean }} PitchStorySection */

/** @typedef {{ id: string, question: string, answer: string, evidence: string, number: string, speaker: string, confidence: string, notes: string }} PanelQuestionRow */

/** @typedef {{ id: string, section: string, speaker: string, durationMin: string, transition: string, visual: string, backupSpeaker: string, notes: string }} SpeakerTimingRow */

/** @typedef {{ id: string, title: string, keyIdea: string, visual: string, keyNumber: string, speaker: string, source: string, status: string, notes: string, hidden?: boolean }} SlidePlanRow */

function makeStoryboard() {
  return WEEK5_DAY2_PITCH_SECTIONS_DEFAULT.map((title, i) => ({
    id: `pitch-${i + 1}`,
    title,
    purpose: '',
    keyMessage: '',
    evidence: '',
    keyNumber: '',
    speaker: '',
    durationMin: '',
    visualIdea: '',
    sourceSection: '',
    notes: '',
  }));
}

function makePanelBank() {
  return WEEK5_DAY2_PANEL_QUESTIONS_DEFAULT.map((question, i) => ({
    id: `panel-${i + 1}`,
    question,
    answer: '',
    evidence: '',
    number: '',
    speaker: '',
    confidence: '3',
    notes: '',
  }));
}

function makeReadiness() {
  return WEEK5_DAY2_READINESS_ITEMS.map((label, i) => ({
    id: `ready-${i + 1}`,
    label,
    status: 'not-reviewed',
    squadNote: '',
    coachNote: '',
  }));
}

/** @param {string} [participantId] */
export function defaultWeek5Day2State(participantId = '') {
  return {
    participantId,
    responses: {},
    storyboard: makeStoryboard(),
    panelBank: makePanelBank(),
    speakerPlan: [],
    slides: [],
    readiness: makeReadiness(),
    reflection: {},
    versions: [],
    pitchMinutesLimit: 12,
    updatedAt: null,
    createdAt: null,
  };
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(WEEK5_DAY2_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(WEEK5_DAY2_STORAGE_KEY, JSON.stringify(data));
}

/** @param {string} participantId */
export function loadWeek5Day2Mission(participantId) {
  if (!participantId) return defaultWeek5Day2State();
  const row = readAll()[participantId];
  if (!row) return defaultWeek5Day2State(participantId);
  const base = defaultWeek5Day2State(participantId);
  return {
    ...base,
    ...row,
    responses: { ...base.responses, ...(row.responses ?? {}) },
    storyboard: row.storyboard?.length ? row.storyboard : base.storyboard,
    panelBank: row.panelBank?.length ? row.panelBank : base.panelBank,
    speakerPlan: row.speakerPlan ?? [],
    slides: row.slides ?? [],
    readiness: row.readiness?.length ? row.readiness : base.readiness,
    reflection: { ...base.reflection, ...(row.reflection ?? {}) },
    versions: Array.isArray(row.versions) ? row.versions.slice(-200) : [],
  };
}

/** @param {string} participantId @param {ReturnType<typeof defaultWeek5Day2State>} state @param {{ fieldId?: string, previousValue?: string, newValue?: string }} [meta] */
export function saveWeek5Day2Mission(participantId, state, meta) {
  if (!participantId) return state;
  const all = readAll();
  const now = new Date().toISOString();
  const versions = [...(state.versions ?? [])];
  if (meta?.fieldId && meta.previousValue !== meta.newValue) {
    versions.push({
      id: `${Date.now()}-${meta.fieldId}`,
      fieldId: meta.fieldId,
      previousValue: String(meta.previousValue ?? ''),
      newValue: String(meta.newValue ?? ''),
      at: now,
    });
  }
  const next = {
    ...state,
    participantId,
    versions: versions.slice(-200),
    updatedAt: now,
    createdAt: state.createdAt ?? all[participantId]?.createdAt ?? now,
  };
  all[participantId] = next;
  writeAll(all);
  return next;
}

/** @param {ReturnType<typeof defaultWeek5Day2State>} state */
export function computePitchDuration(state) {
  const fromStory = state.storyboard
    .filter((s) => !s.hidden)
    .reduce((sum, s) => sum + (Number(s.durationMin) || 0), 0);
  const fromSpeakers = state.speakerPlan.reduce((sum, s) => sum + (Number(s.durationMin) || 0), 0);
  return Math.max(fromStory, fromSpeakers);
}
