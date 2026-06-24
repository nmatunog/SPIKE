/**
 * Week 2 Customer Discovery — local persistence.
 */
import { DEFAULT_INTERVIEW_QUESTIONS, MAX_INTERVIEW_QUESTIONS } from './week2Constants.js';
import { extractInterviewInsights } from './week2InsightSynthesis.js';

const STORAGE_KEY = 'spike_week2_discovery_v2';
const LEGACY_STORAGE_KEY = 'spike_week2_discovery_v1';
const SESSION_BACKUP_KEY = 'spike_week2_discovery_v2_session';

/** @type {Record<string, import('./week2DiscoveryTypes.js').Week2DiscoveryState>} */
const memoryCache = {};

function readAll() {
  /** @type {Record<string, unknown>} */
  let merged = { ...memoryCache };
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (current && typeof current === 'object') merged = { ...merged, ...current };
  } catch {
    /* Safari private mode / ITP */
  }
  if (!Object.keys(merged).length) {
    try {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '{}');
      if (legacy && typeof legacy === 'object') merged = { ...merged, ...legacy };
    } catch {
      /* ignore */
    }
  }
  try {
    const backup = JSON.parse(sessionStorage.getItem(SESSION_BACKUP_KEY) || '{}');
    if (backup && typeof backup === 'object') merged = { ...backup, ...merged };
  } catch {
    /* ignore */
  }
  return merged;
}

/** @param {Record<string, unknown>} data */
function writeAll(data) {
  Object.assign(memoryCache, data);
  let persisted = false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    persisted = true;
  } catch (err) {
    console.warn('[week2Discovery] localStorage write failed', err);
  }
  try {
    sessionStorage.setItem(SESSION_BACKUP_KEY, JSON.stringify(data));
    persisted = true;
  } catch {
    /* ignore */
  }
  if (!persisted) {
    console.warn('[week2Discovery] using in-memory cache only — enable cloud sync or free storage');
  }
}

function scheduleCloudSync(participantId, state) {
  void import('./week2DiscoverySync.js')
    .then((m) => m.syncWeek2DiscoveryToCloud(participantId, state))
    .catch(() => {});
}

/** @param {string[] | null | undefined} answers */
export function padInterviewAnswers(answers) {
  const base = [...(answers ?? [])];
  while (base.length < MAX_INTERVIEW_QUESTIONS) base.push('');
  return base.slice(0, MAX_INTERVIEW_QUESTIONS);
}

/** @returns {import('./week2DiscoveryTypes.js').Week2DiscoveryState} */
export function defaultWeek2State() {
  return {
    missionAcknowledged: false,
    assumptionsCompletedAt: null,
    guideCompletedAt: null,
    researchPlanSubmittedAt: null,
    squadAlignedAt: null,
    portfolioSyncedAt: null,
    exchangeReflectionAt: null,
    exchangeReflectionText: '',
    professionalReadinessAt: null,
    readinessReflectionAt: null,
    synthesisReviewedAt: null,
    intelligenceBoardAt: null,
    pitchStartedAt: null,
    pitchSubmittedAt: null,
    assumptions: [],
    questions: DEFAULT_INTERVIEW_QUESTIONS.map((q) => ({ ...q })),
    thinkingShifts: [],
    interviews: [],
    fieldResearchPlan: '',
    squadDiscussionNotes: '',
    readinessEvidenceNote: '',
    pctcStartedAt: null,
    pctcCertificate1Id: '',
    pctcCertificate2Id: '',
    readinessBadgeEarnedAt: null,
    readinessReflectionSurprised: '',
    readinessReflectionResponsibility: '',
    readinessReflectionTrustedAdvisor: '',
    readinessReflectionSummary: '',
    readinessReflectionApprovedAt: null,
    uvpCheckpointOriginal: '',
    uvpCheckpointVerdict: '',
    uvpCheckpointNotes: '',
    uvpCheckpointAt: null,
    pitchOutline: {
      mission: '',
      whoInterviewed: '',
      whatWeThought: '',
      whatWeLearned: '',
      customerVoices: '',
      biggestProblem: '',
      beliefShift: '',
      ventureChanged: '',
      nextSteps: '',
      advisorInsight: '',
    },
    cloudSyncedAt: null,
    updatedAt: null,
  };
}

/** @param {string} participantId */
export function loadWeek2Discovery(participantId) {
  const stored = readAll()[participantId];
  if (!stored) return defaultWeek2State();
  return {
    ...defaultWeek2State(),
    ...stored,
    questions: stored.questions?.length ? stored.questions : defaultWeek2State().questions,
    assumptions: stored.assumptions ?? [],
    thinkingShifts: stored.thinkingShifts ?? [],
    interviews: (stored.interviews ?? []).map((iv) => {
      const answers = padInterviewAnswers(iv.answers);
      const encoded = Boolean(iv.encoded);
      return {
        id: iv.id ?? `iv-${Date.now()}`,
        alias: iv.alias ?? '',
        occupation: iv.occupation ?? '',
        answers,
        reflection: iv.reflection ?? '',
        encoded,
        aiInsights: iv.aiInsights ?? (encoded ? extractInterviewInsights(answers) : undefined),
        encodedAt: iv.encodedAt ?? null,
      };
    }),
    fieldResearchPlan: stored.fieldResearchPlan ?? '',
    squadDiscussionNotes: stored.squadDiscussionNotes ?? '',
    exchangeReflectionText: stored.exchangeReflectionText ?? '',
    readinessEvidenceNote: stored.readinessEvidenceNote ?? '',
    pctcCertificate1Id: stored.pctcCertificate1Id ?? '',
    pctcCertificate2Id: stored.pctcCertificate2Id ?? '',
    pitchOutline: { ...defaultWeek2State().pitchOutline, ...(stored.pitchOutline ?? {}) },
    cloudSyncedAt: stored.cloudSyncedAt ?? null,
  };
}

/**
 * @param {string} participantId
 * @param {Partial<import('./week2DiscoveryTypes.js').Week2DiscoveryState>} patch
 * @param {{ skipCloudSync?: boolean }} [opts]
 */
export function saveWeek2Discovery(participantId, patch, opts = {}) {
  const all = readAll();
  const current = loadWeek2Discovery(participantId);
  const next = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  all[participantId] = next;
  memoryCache[participantId] = next;
  writeAll(all);
  if (!opts.skipCloudSync) scheduleCloudSync(participantId, next);
  return next;
}

/** @param {string} participantId */
export function resetWeek2Discovery(participantId) {
  const all = readAll();
  delete all[participantId];
  writeAll(all);
}
