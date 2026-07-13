import { WEEK5_DAY1_SECTIONS, WEEK5_DEFAULT_JOURNEY_STAGES } from './missionConstants.js';

export const WEEK5_DAY1_STORAGE_KEY = 'spike_week5_day1_mission_v1';

/** @returns {import('./types.js').Week5Day1MissionState} */
export function defaultWeek5Day1State(participantId = '') {
  const responses = {
    weeklyProspects: '10',
    weeklyDiscovery: '5',
    weeklyPresentations: '3',
    weeklyClients: '1',
    referralsPerClient: '3',
  };
  return {
    participantId,
    responses,
    journeyStages: WEEK5_DEFAULT_JOURNEY_STAGES.map((s) => ({ ...s })),
    fecPitchLocks: {},
    sectionStatus: {},
    reflection: {},
    versions: [],
    updatedAt: null,
    createdAt: null,
  };
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(WEEK5_DAY1_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(WEEK5_DAY1_STORAGE_KEY, JSON.stringify(data));
}

/** @param {string} participantId */
export function loadWeek5Day1Mission(participantId) {
  if (!participantId) return defaultWeek5Day1State();
  const row = readAll()[participantId];
  if (!row) return defaultWeek5Day1State(participantId);
  const base = defaultWeek5Day1State(participantId);
  return {
    ...base,
    ...row,
    responses: { ...base.responses, ...(row.responses ?? {}) },
    journeyStages: row.journeyStages?.length
      ? row.journeyStages
      : base.journeyStages,
    fecPitchLocks: { ...base.fecPitchLocks, ...(row.fecPitchLocks ?? {}) },
    sectionStatus: { ...base.sectionStatus, ...(row.sectionStatus ?? {}) },
    reflection: { ...base.reflection, ...(row.reflection ?? {}) },
    versions: Array.isArray(row.versions) ? row.versions.slice(-200) : [],
  };
}

/**
 * @param {string} participantId
 * @param {import('./types.js').Week5Day1MissionState} state
 * @param {{ fieldId?: string, previousValue?: string, newValue?: string, aiAssisted?: boolean }} [versionMeta]
 */
export function saveWeek5Day1Mission(participantId, state, versionMeta) {
  if (!participantId) return state;
  const all = readAll();
  const now = new Date().toISOString();
  const versions = [...(state.versions ?? [])];
  if (versionMeta?.fieldId && versionMeta.previousValue !== versionMeta.newValue) {
    versions.push({
      id: `${Date.now()}-${versionMeta.fieldId}`,
      fieldId: versionMeta.fieldId,
      previousValue: String(versionMeta.previousValue ?? ''),
      newValue: String(versionMeta.newValue ?? ''),
      at: now,
      aiAssisted: Boolean(versionMeta.aiAssisted),
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

/** @param {import('./types.js').Week5Day1MissionState} state */
export function computeWeek5Day1SectionProgress(state) {
  const total = WEEK5_DAY1_SECTIONS.length;
  let touched = 0;
  for (const section of WEEK5_DAY1_SECTIONS) {
    if (section.kind === 'journey') {
      if (state.journeyStages.some((s) => s.description.trim())) touched += 1;
      continue;
    }
    if (section.kind === 'reflection') {
      if (Object.values(state.reflection).some((v) => String(v).trim())) touched += 1;
      continue;
    }
    if (section.kind === 'fec') {
      touched += 1;
      continue;
    }
    const hasField = (section.fields ?? []).some((f) => String(state.responses[f.id] ?? '').trim());
    if (hasField) touched += 1;
  }
  return { touched, total, pct: Math.round((touched / total) * 100) };
}
