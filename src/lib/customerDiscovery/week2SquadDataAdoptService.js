/**
 * Prompt squad members to adopt the richest Week 2 discovery save from a squadmate.
 */
import { loadWeek2Discovery, saveWeek2Discovery } from './week2DiscoveryStorage.js';
import { mergeWeek2Interviews } from './week2DiscoveryMerge.js';
import { getSquadMemberIds } from './week2SquadEvidenceService.js';
import { isTaskComplete } from './week2MissionService.js';
import { allWeek2MissionTasks } from './week2JourneyConstants.js';
import { getExchangeReflectionText } from './week2DiscoveryService.js';
import { syncWeek2Day1Portfolio, syncWeek2PortfolioArtifacts } from './week2PortfolioSync.js';
import { isPctcMissionComplete } from './week2PctcCertificateService.js';

const DISMISS_KEY = 'spike_week2_squad_adopt_dismiss_v1';
const MIN_TASK_GAP = 1;
const MIN_FIELD_GAP = 3;

/** @param {string} a @param {string} b */
function pickRicherText(a, b) {
  const textA = String(a ?? '').trim();
  const textB = String(b ?? '').trim();
  if (!textA) return textB;
  if (!textB) return textA;
  return textB.length >= textA.length ? textB : textA;
}

/** @param {import('./week2DiscoveryTypes.js').Week2Assumption[] | undefined} a @param {import('./week2DiscoveryTypes.js').Week2Assumption[] | undefined} b */
function pickRicherAssumptions(a, b) {
  const score = (rows) => (rows ?? []).reduce(
    (sum, row) => sum + String(row.belief ?? '').trim().length,
    0,
  );
  return score(a) >= score(b) ? (a ?? []) : (b ?? []);
}

/** @param {import('./week2DiscoveryTypes.js').Week2Question[] | undefined} a @param {import('./week2DiscoveryTypes.js').Week2Question[] | undefined} b */
function pickRicherQuestions(a, b) {
  const filled = (rows) => (rows ?? []).filter((q) => String(q.text ?? '').trim().length > 8).length;
  if (filled(a) > filled(b)) return a ?? [];
  if (filled(b) > filled(a)) return b ?? [];
  const score = (rows) => (rows ?? []).reduce((sum, q) => sum + String(q.text ?? '').trim().length, 0);
  return score(a) >= score(b) ? (a ?? []) : (b ?? []);
}

/** @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} state */
function countFilledTextFields(state) {
  let n = 0;
  n += (state.assumptions ?? []).filter((a) => String(a.belief ?? '').trim().length > 5).length;
  n += (state.questions ?? []).filter((q) => String(q.text ?? '').trim().length > 8).length;
  if (String(state.fieldResearchPlan ?? '').trim().length > 10) n += 1;
  if (String(state.squadDiscussionNotes ?? '').trim().length > 5) n += 1;
  if (String(getExchangeReflectionText(state)).length > 10) n += 1;
  n += (state.interviews ?? []).filter((iv) => iv.encoded).length;
  n += Object.values(state.pitchOutline ?? {}).filter((v) => String(v ?? '').trim().length > 10).length;
  for (const key of ['weekWrapBiggestLearning', 'weekWrapEvidenceShift', 'weekWrapVentureEvolution', 'weekWrapWeek3Focus']) {
    if (String(state[key] ?? '').trim().length > 10) n += 1;
  }
  return n;
}

/** @param {string} participantId */
export function scoreWeek2DiscoveryRichnessForMember(participantId) {
  const tasks = allWeek2MissionTasks().filter((t) => !t.optional);
  const taskComplete = tasks.filter((t) => isTaskComplete(participantId, t.id)).length;
  const fieldCount = countFilledTextFields(loadWeek2Discovery(participantId));
  return {
    filled: taskComplete,
    total: tasks.length,
    fieldCount,
    detail: `${taskComplete}/${tasks.length} mission steps · ${fieldCount} fields with content`,
  };
}

/** @param {string} participantId @param {string} sourceMemberId @param {number} richestFilled */
function isAdoptPromptDismissed(participantId, sourceMemberId, richestFilled) {
  try {
    const all = JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}');
    const row = all[`${participantId}:${sourceMemberId}`];
    if (!row || typeof row !== 'object') return false;
    return Number(row.filled ?? 0) + MIN_FIELD_GAP > richestFilled;
  } catch {
    return false;
  }
}

/** @param {string} participantId @param {string} sourceMemberId @param {number} richestFilled */
export function dismissSquadDataAdoptPrompt(participantId, sourceMemberId, richestFilled) {
  try {
    const all = JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}');
    all[`${participantId}:${sourceMemberId}`] = {
      filled: richestFilled,
      at: new Date().toISOString(),
    };
    localStorage.setItem(DISMISS_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} participantId
 * @param {Record<string, string>} [memberNames]
 */
export function deriveSquadDataAdoptOffer(participantId, memberNames = {}) {
  const memberIds = getSquadMemberIds(participantId).filter(Boolean);
  if (memberIds.length < 2) return null;

  const rows = memberIds.map((id) => ({
    memberId: id,
    label: memberNames[id] || `Squad member`,
    score: scoreWeek2DiscoveryRichnessForMember(id),
  }));

  const self = rows.find((row) => row.memberId === participantId);
  if (!self) return null;

  const richest = rows.reduce((best, row) => (
    row.score.filled > best.score.filled
    || (row.score.filled === best.score.filled && row.score.fieldCount > best.score.fieldCount)
      ? row
      : best
  ));

  if (richest.memberId === participantId) return null;

  const taskGap = richest.score.filled - self.score.filled;
  const fieldGap = richest.score.fieldCount - self.score.fieldCount;
  if (taskGap < MIN_TASK_GAP && fieldGap < MIN_FIELD_GAP) return null;
  if (isAdoptPromptDismissed(participantId, richest.memberId, richest.score.fieldCount)) return null;

  return {
    sourceMemberId: richest.memberId,
    sourceLabel: richest.label,
    selfFilled: self.score.filled,
    selfTotal: self.score.total,
    selfFieldCount: self.score.fieldCount,
    richestFilled: richest.score.filled,
    richestFieldCount: richest.score.fieldCount,
    richestDetail: richest.score.detail,
    taskGap,
    fieldGap,
  };
}

/** @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} target @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} source */
function mergeThinkingShifts(target, source) {
  const byTask = new Map();
  for (const shift of [...(target.thinkingShifts ?? []), ...(source.thinkingShifts ?? [])]) {
    const key = shift.taskId || shift.id;
    const prior = byTask.get(key);
    const next = !prior
      || String(shift.response ?? '').trim().length > String(prior.response ?? '').trim().length
      ? shift
      : prior;
    byTask.set(key, next);
  }
  return [...byTask.values()];
}

/** @param {import('./week2DiscoveryTypes.js').Week2PitchOutline | undefined} target @param {import('./week2DiscoveryTypes.js').Week2PitchOutline | undefined} source */
function mergePitchOutline(target, source) {
  /** @type {Record<string, string>} */
  const merged = { ...(target ?? {}) };
  for (const [key, value] of Object.entries(source ?? {})) {
    merged[key] = pickRicherText(merged[key], value);
  }
  return merged;
}

/**
 * Copy richer squadmate discovery fields into the current intern's save.
 * @param {string} participantId
 * @param {string} sourceMemberId
 */
export function adoptSquadDiscoveryFromMember(participantId, sourceMemberId) {
  if (!participantId || !sourceMemberId || participantId === sourceMemberId) {
    return loadWeek2Discovery(participantId);
  }

  const target = loadWeek2Discovery(participantId);
  const source = loadWeek2Discovery(sourceMemberId);
  const now = new Date().toISOString();

  const assumptions = pickRicherAssumptions(target.assumptions, source.assumptions);
  const questions = pickRicherQuestions(target.questions, source.questions);
  const fieldResearchPlan = pickRicherText(target.fieldResearchPlan, source.fieldResearchPlan);
  const squadDiscussionNotes = pickRicherText(target.squadDiscussionNotes, source.squadDiscussionNotes);
  const exchangeReflectionText = pickRicherText(
    getExchangeReflectionText(target),
    getExchangeReflectionText(source),
  );

  /** @type {Partial<import('./week2DiscoveryTypes.js').Week2DiscoveryState>} */
  const patch = {
    missionAcknowledged: target.missionAcknowledged || source.missionAcknowledged,
    assumptions,
    questions,
    interviews: mergeWeek2Interviews(target.interviews, source.interviews),
    fieldResearchPlan,
    squadDiscussionNotes,
    exchangeReflectionText,
    thinkingShifts: mergeThinkingShifts(target, source),
    readinessEvidenceNote: pickRicherText(target.readinessEvidenceNote, source.readinessEvidenceNote),
    readinessReflectionSurprised: pickRicherText(target.readinessReflectionSurprised, source.readinessReflectionSurprised),
    readinessReflectionResponsibility: pickRicherText(target.readinessReflectionResponsibility, source.readinessReflectionResponsibility),
    readinessReflectionTrustedAdvisor: pickRicherText(target.readinessReflectionTrustedAdvisor, source.readinessReflectionTrustedAdvisor),
    readinessReflectionSummary: pickRicherText(target.readinessReflectionSummary, source.readinessReflectionSummary),
    uvpCheckpointOriginal: pickRicherText(target.uvpCheckpointOriginal, source.uvpCheckpointOriginal),
    uvpCheckpointVerdict: pickRicherText(target.uvpCheckpointVerdict, source.uvpCheckpointVerdict),
    uvpCheckpointNotes: pickRicherText(target.uvpCheckpointNotes, source.uvpCheckpointNotes),
    pitchOutline: mergePitchOutline(target.pitchOutline, source.pitchOutline),
    weekWrapBiggestLearning: pickRicherText(target.weekWrapBiggestLearning, source.weekWrapBiggestLearning),
    weekWrapEvidenceShift: pickRicherText(target.weekWrapEvidenceShift, source.weekWrapEvidenceShift),
    weekWrapVentureEvolution: pickRicherText(target.weekWrapVentureEvolution, source.weekWrapVentureEvolution),
    weekWrapWeek3Focus: pickRicherText(target.weekWrapWeek3Focus, source.weekWrapWeek3Focus),
    pctcCertificate1Id: target.pctcCertificate1Id || source.pctcCertificate1Id,
    pctcCertificate2Id: target.pctcCertificate2Id || source.pctcCertificate2Id,
  };

  if (assumptions.filter((a) => String(a.belief ?? '').trim().length > 5).length >= 2) {
    patch.assumptionsCompletedAt = target.assumptionsCompletedAt || source.assumptionsCompletedAt || now;
  }
  if (questions.filter((q) => String(q.text ?? '').trim().length > 8).length >= 5) {
    patch.guideCompletedAt = target.guideCompletedAt || source.guideCompletedAt || now;
  }
  if (fieldResearchPlan.trim().length > 40) {
    patch.researchPlanSubmittedAt = target.researchPlanSubmittedAt || source.researchPlanSubmittedAt || now;
  }
  if (squadDiscussionNotes.trim().length > 10 || source.squadAlignedAt) {
    patch.squadAlignedAt = target.squadAlignedAt || source.squadAlignedAt || now;
  }
  if (exchangeReflectionText.trim().length > 15) {
    patch.exchangeReflectionAt = target.exchangeReflectionAt || source.exchangeReflectionAt || now;
  }
  if (String(patch.readinessEvidenceNote ?? '').trim().length > 10) {
    patch.professionalReadinessAt = target.professionalReadinessAt || source.professionalReadinessAt || now;
  }
  if (String(patch.readinessReflectionSummary ?? '').trim().length > 15) {
    patch.readinessReflectionAt = target.readinessReflectionAt || source.readinessReflectionAt || now;
    patch.readinessReflectionApprovedAt = target.readinessReflectionApprovedAt || source.readinessReflectionApprovedAt || null;
  }
  if (String(patch.uvpCheckpointVerdict ?? '').trim()) {
    patch.uvpCheckpointAt = target.uvpCheckpointAt || source.uvpCheckpointAt || now;
  }
  if (isPctcMissionComplete({ ...target, ...patch })) {
    patch.pctcStartedAt = target.pctcStartedAt || source.pctcStartedAt || now;
    patch.readinessBadgeEarnedAt = target.readinessBadgeEarnedAt || source.readinessBadgeEarnedAt || null;
  }
  const pitchFilled = Object.values(patch.pitchOutline ?? {}).filter((v) => String(v ?? '').trim().length > 10).length;
  if (pitchFilled >= 3) patch.pitchStartedAt = target.pitchStartedAt || source.pitchStartedAt || now;
  if (pitchFilled >= 7) patch.pitchSubmittedAt = target.pitchSubmittedAt || source.pitchSubmittedAt || now;
  const wrapFilled = [
    patch.weekWrapBiggestLearning,
    patch.weekWrapEvidenceShift,
    patch.weekWrapVentureEvolution,
    patch.weekWrapWeek3Focus,
  ].filter((v) => String(v ?? '').trim().length > 10).length;
  if (wrapFilled >= 4) {
    patch.weekWrapCompletedAt = target.weekWrapCompletedAt || source.weekWrapCompletedAt || now;
  }

  const next = saveWeek2Discovery(participantId, patch);
  syncWeek2PortfolioArtifacts(participantId);
  if (next.guideCompletedAt || next.missionAcknowledged) {
    syncWeek2Day1Portfolio(participantId);
  }
  return next;
}
