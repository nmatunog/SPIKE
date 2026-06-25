/**
 * Studio 2 & 3 squad draft variants — most recent save vs richest merged fields.
 * Studio 1 raw evidence uses per-member drafts only (see week2EvidenceBoardCandidates.js).
 */
import { loadFecValidation, saveFecValidation } from './week2FecValidationStorage.js';
import { getSquadNameForParticipant, squadEvidenceSummary } from './week2SquadEvidenceService.js';
import { syncFecValidationToCloud } from './week2FecValidationSync.js';
import { FEC_BOX_META, PITCH_SLIDE_KEYS } from './week2FecValidationConstants.js';

/** @typedef {'recent' | 'filled'} StudioDraftSourceChoice */

/** @typedef {Object} Studio2BoxDraft
 * @property {string} week2Text
 * @property {string} verdict
 */

/**
 * @typedef {Object} Studio2MemberDraft
 * @property {Record<string, Studio2BoxDraft>} boxes
 * @property {string} draftUpdatedAt
 * @property {string} draftBy
 */

/**
 * @typedef {Object} Studio3MemberDraft
 * @property {string} strategicOpportunity
 * @property {string} nextExperiment
 * @property {string} week3BuildDirection
 * @property {Record<string, string>} pitchSlides
 * @property {string} draftUpdatedAt
 * @property {string} draftBy
 */

/**
 * @typedef {Object} StudioDraftCandidateView
 * @property {StudioDraftSourceChoice} id
 * @property {string} label
 * @property {string} description
 * @property {Studio2MemberDraft | Studio3MemberDraft} draft
 * @property {{ filledFields: number, totalFields: number, draftAt: string, draftBy: string, memberLabel: string, detail: string }} meta
 */

const STUDIO2_BOX_IDS = Object.keys(FEC_BOX_META);

/** @param {string} participantId */
export function squadKeyForParticipant(participantId) {
  return getSquadNameForParticipant(participantId) || `solo-${participantId}`;
}

/** @param {string} memberId @param {Record<string, string>} [memberNames] */
function memberLabel(memberId, memberNames = {}) {
  if (!memberId) return 'Squad';
  return memberNames[memberId] || `Member ${String(memberId).slice(0, 6)}`;
}

/** @param {string} a @param {string} b */
function pickRicherText(a, b) {
  const textA = String(a ?? '').trim();
  const textB = String(b ?? '').trim();
  if (!textA) return textB;
  if (!textB) return textA;
  return textB.length > textA.length ? textB : textA;
}

/** @param {Studio2MemberDraft} draft */
function normalizeStudio2Draft(draft) {
  /** @type {Record<string, Studio2BoxDraft>} */
  const boxes = {};
  for (const boxId of STUDIO2_BOX_IDS) {
    const row = draft?.boxes?.[boxId] ?? {};
    boxes[boxId] = {
      week2Text: String(row.week2Text ?? ''),
      verdict: String(row.verdict ?? 'keep'),
    };
  }
  return {
    boxes,
    draftUpdatedAt: String(draft?.draftUpdatedAt ?? ''),
    draftBy: String(draft?.draftBy ?? ''),
  };
}

/** @param {Studio3MemberDraft} draft */
function normalizeStudio3Draft(draft) {
  /** @type {Record<string, string>} */
  const pitchSlides = {};
  for (const { key } of PITCH_SLIDE_KEYS) {
    pitchSlides[key] = String(draft?.pitchSlides?.[key] ?? '');
  }
  return {
    strategicOpportunity: String(draft?.strategicOpportunity ?? ''),
    nextExperiment: String(draft?.nextExperiment ?? ''),
    week3BuildDirection: String(draft?.week3BuildDirection ?? ''),
    pitchSlides,
    draftUpdatedAt: String(draft?.draftUpdatedAt ?? ''),
    draftBy: String(draft?.draftBy ?? ''),
  };
}

/** @param {Studio2MemberDraft} draft */
function studio2FilledCount(draft) {
  return STUDIO2_BOX_IDS.filter((id) => String(draft.boxes?.[id]?.week2Text ?? '').trim()).length;
}

/** @param {Studio3MemberDraft} draft */
function studio3FilledCount(draft) {
  let n = 0;
  if (String(draft.strategicOpportunity ?? '').trim()) n += 1;
  if (String(draft.nextExperiment ?? '').trim()) n += 1;
  if (String(draft.week3BuildDirection ?? '').trim()) n += 1;
  for (const { key } of PITCH_SLIDE_KEYS) {
    if (String(draft.pitchSlides?.[key] ?? '').trim()) n += 1;
  }
  return n;
}

/** @param {Studio2MemberDraft[]} drafts */
function buildMostFilledStudio2(drafts) {
  /** @type {Record<string, Studio2BoxDraft>} */
  const boxes = {};
  for (const boxId of STUDIO2_BOX_IDS) {
    let week2Text = '';
    let verdict = 'keep';
    let sourceBy = '';
    for (const draft of drafts) {
      const row = draft.boxes?.[boxId] ?? {};
      const nextText = String(row.week2Text ?? '').trim();
      if (!nextText) continue;
      if (nextText.length > week2Text.length) {
        week2Text = nextText;
        verdict = String(row.verdict ?? 'keep');
        sourceBy = draft.draftBy;
      }
    }
    boxes[boxId] = { week2Text, verdict };
    if (sourceBy && !boxes[boxId].week2Text) {
      boxes[boxId] = { week2Text, verdict };
    }
  }
  const richest = drafts.reduce((best, draft) => (
    studio2FilledCount(draft) > studio2FilledCount(best) ? draft : best
  ), normalizeStudio2Draft({}));
  return normalizeStudio2Draft({
    boxes,
    draftUpdatedAt: richest.draftUpdatedAt,
    draftBy: richest.draftBy,
  });
}

/** @param {Studio2MemberDraft[]} drafts */
function pickMostRecentStudio2(drafts) {
  if (!drafts.length) return normalizeStudio2Draft({});
  return drafts.reduce((best, draft) => {
    const bestAt = String(best.draftUpdatedAt ?? '');
    const draftAt = String(draft.draftUpdatedAt ?? '');
    if (draftAt > bestAt) return draft;
    if (draftAt < bestAt) return best;
    return studio2FilledCount(draft) > studio2FilledCount(best) ? draft : best;
  });
}

/** @param {Studio3MemberDraft[]} drafts */
function buildMostFilledStudio3(drafts) {
  if (!drafts.length) return normalizeStudio3Draft({});
  let strategicOpportunity = '';
  let nextExperiment = '';
  let week3BuildDirection = '';
  /** @type {Record<string, string>} */
  const pitchSlides = {};
  for (const { key } of PITCH_SLIDE_KEYS) pitchSlides[key] = '';

  for (const draft of drafts) {
    strategicOpportunity = pickRicherText(strategicOpportunity, draft.strategicOpportunity);
    nextExperiment = pickRicherText(nextExperiment, draft.nextExperiment);
    week3BuildDirection = pickRicherText(week3BuildDirection, draft.week3BuildDirection);
    for (const { key } of PITCH_SLIDE_KEYS) {
      pitchSlides[key] = pickRicherText(pitchSlides[key], draft.pitchSlides?.[key]);
    }
  }

  const richest = drafts.reduce((best, draft) => (
    studio3FilledCount(draft) > studio3FilledCount(best) ? draft : best
  ), normalizeStudio3Draft({}));

  return normalizeStudio3Draft({
    strategicOpportunity,
    nextExperiment,
    week3BuildDirection,
    pitchSlides,
    draftUpdatedAt: richest.draftUpdatedAt,
    draftBy: richest.draftBy,
  });
}

/** @param {Studio3MemberDraft[]} drafts */
function pickMostRecentStudio3(drafts) {
  if (!drafts.length) return normalizeStudio3Draft({});
  return drafts.reduce((best, draft) => {
    const bestAt = String(best.draftUpdatedAt ?? '');
    const draftAt = String(draft.draftUpdatedAt ?? '');
    if (draftAt > bestAt) return draft;
    if (draftAt < bestAt) return best;
    return studio3FilledCount(draft) > studio3FilledCount(best) ? draft : best;
  });
}

/** @param {import('./week2FecValidationTypes.js').FecValidationSquadState} fecState */
function collectStudio2Drafts(fecState) {
  /** @type {Studio2MemberDraft[]} */
  const drafts = [];
  for (const draft of Object.values(fecState.studio2DraftsByMember ?? {})) {
    if (draft && typeof draft === 'object') drafts.push(normalizeStudio2Draft(draft));
  }
  return drafts;
}

/** @param {import('./week2FecValidationTypes.js').FecValidationSquadState} fecState */
function collectStudio3Drafts(fecState) {
  /** @type {Studio3MemberDraft[]} */
  const drafts = [];
  for (const draft of Object.values(fecState.studio3DraftsByMember ?? {})) {
    if (draft && typeof draft === 'object') drafts.push(normalizeStudio3Draft(draft));
  }
  return drafts;
}

/**
 * @param {'studio2' | 'studio3'} studio
 * @param {import('./week2FecValidationTypes.js').FecValidationSquadState} fecState
 * @param {Record<string, string>} [memberNames]
 */
function deriveStudioDraftCandidates(studio, fecState, memberNames = {}) {
  const isStudio2 = studio === 'studio2';
  const drafts = isStudio2 ? collectStudio2Drafts(fecState) : collectStudio3Drafts(fecState);
  const recent = isStudio2 ? pickMostRecentStudio2(drafts) : pickMostRecentStudio3(drafts);
  const filled = isStudio2 ? buildMostFilledStudio2(drafts) : buildMostFilledStudio3(drafts);
  const totalFields = isStudio2 ? STUDIO2_BOX_IDS.length : 3 + PITCH_SLIDE_KEYS.length;
  const filledRecent = isStudio2 ? studio2FilledCount(recent) : studio3FilledCount(recent);
  const filledFilled = isStudio2 ? studio2FilledCount(filled) : studio3FilledCount(filled);
  const signature = (d) => JSON.stringify(d);

  const toView = (id, label, description, draft, filledFields, detail) => ({
    id,
    label,
    description,
    draft,
    meta: {
      filledFields,
      totalFields,
      draftAt: String(draft.draftUpdatedAt ?? ''),
      draftBy: String(draft.draftBy ?? ''),
      memberLabel: memberLabel(String(draft.draftBy ?? ''), memberNames),
      detail,
    },
  });

  const hasContent = drafts.some((d) => (isStudio2 ? studio2FilledCount(d) : studio3FilledCount(d)) > 0);
  const hasChoice = hasContent && signature(recent) !== signature(filled);

  return {
    recent: toView(
      'recent',
      'Most recent save',
      'The latest squad member edit for this studio.',
      recent,
      filledRecent,
      `Last saved by ${memberLabel(recent.draftBy, memberNames)}`,
    ),
    filled: toView(
      'filled',
      'Most filled fields',
      isStudio2
        ? 'Richest Week 2 text per FEC box across all squad saves.'
        : 'Richest text per field across all squad saves.',
      filled,
      filledFilled,
      isStudio2 ? 'Best draft line per FEC box' : 'Best text per pitch / planning field',
    ),
    hasChoice,
    locked: Boolean(isStudio2 ? fecState.studio2ApprovedAt : fecState.studio3ApprovedAt),
  };
}

/** @param {string} participantId @param {Record<string, string>} [memberNames] */
export function getStudio2ChoiceContext(participantId, memberNames = {}) {
  const fec = loadFecValidation(squadKeyForParticipant(participantId));
  const candidates = deriveStudioDraftCandidates('studio2', fec, memberNames);
  const source = fec.studio2SourceByMember?.[participantId] === 'recent' ? 'recent' : 'filled';
  const active = source === 'recent' ? candidates.recent : candidates.filled;
  return { ...candidates, activeSource: source, activeDraft: active.draft };
}

/** @param {string} participantId @param {Record<string, string>} [memberNames] */
export function getStudio3ChoiceContext(participantId, memberNames = {}) {
  const fec = loadFecValidation(squadKeyForParticipant(participantId));
  const candidates = deriveStudioDraftCandidates('studio3', fec, memberNames);
  const source = fec.studio3SourceByMember?.[participantId] === 'recent' ? 'recent' : 'filled';
  const active = source === 'recent' ? candidates.recent : candidates.filled;
  return { ...candidates, activeSource: source, activeDraft: active.draft };
}

/** @param {string} participantId @param {'studio2' | 'studio3'} studio @param {StudioDraftSourceChoice} source */
export function setMemberStudioDraftSource(participantId, studio, source) {
  const key = squadKeyForParticipant(participantId);
  const current = loadFecValidation(key);
  const patch = studio === 'studio2'
    ? { studio2SourceByMember: { ...(current.studio2SourceByMember ?? {}), [participantId]: source } }
    : { studio3SourceByMember: { ...(current.studio3SourceByMember ?? {}), [participantId]: source } };
  const next = saveFecValidation(key, patch);
  void syncFecValidationToCloud(key, next, squadEvidenceSummary(participantId).memberIds).catch(() => {});
  return next;
}

/** @param {string} participantId @param {Record<string, Studio2BoxDraft>} boxes @param {StudioDraftSourceChoice} [source] */
export function saveStudio2Draft(participantId, boxes, source) {
  const key = squadKeyForParticipant(participantId);
  const current = loadFecValidation(key);
  const now = new Date().toISOString();
  const draft = normalizeStudio2Draft({ boxes, draftUpdatedAt: now, draftBy: participantId });
  const resolvedSource = source
    ?? (current.studio2SourceByMember?.[participantId] === 'recent' ? 'recent' : 'filled');
  const next = saveFecValidation(key, {
    studio2DraftsByMember: { ...(current.studio2DraftsByMember ?? {}), [participantId]: draft },
    studio2SourceByMember: { ...(current.studio2SourceByMember ?? {}), [participantId]: resolvedSource },
  });
  void syncFecValidationToCloud(key, next, squadEvidenceSummary(participantId).memberIds).catch(() => {});
  return next;
}

/**
 * @param {string} participantId
 * @param {Omit<Studio3MemberDraft, 'draftUpdatedAt' | 'draftBy'>} input
 * @param {StudioDraftSourceChoice} [source]
 */
export function saveStudio3Draft(participantId, input, source) {
  const key = squadKeyForParticipant(participantId);
  const current = loadFecValidation(key);
  const now = new Date().toISOString();
  const draft = normalizeStudio3Draft({ ...input, draftUpdatedAt: now, draftBy: participantId });
  const resolvedSource = source
    ?? (current.studio3SourceByMember?.[participantId] === 'recent' ? 'recent' : 'filled');
  const next = saveFecValidation(key, {
    studio3DraftsByMember: { ...(current.studio3DraftsByMember ?? {}), [participantId]: draft },
    studio3SourceByMember: { ...(current.studio3SourceByMember ?? {}), [participantId]: resolvedSource },
  });
  void syncFecValidationToCloud(key, next, squadEvidenceSummary(participantId).memberIds).catch(() => {});
  return next;
}

/** @param {Record<string, Studio2MemberDraft>} map @param {Record<string, Studio2MemberDraft> | undefined} incoming */
function mergeStudio2DraftMap(map, incoming) {
  const out = { ...map };
  for (const [memberId, draft] of Object.entries(incoming ?? {})) {
    if (!draft || typeof draft !== 'object') continue;
    const normalized = normalizeStudio2Draft(draft);
    const existing = out[memberId];
    const existingAt = String(existing?.draftUpdatedAt ?? '');
    const draftAt = String(normalized.draftUpdatedAt ?? '');
    if (!existing || draftAt >= existingAt) out[memberId] = normalized;
  }
  return out;
}

/** @param {Record<string, Studio3MemberDraft>} map @param {Record<string, Studio3MemberDraft> | undefined} incoming */
function mergeStudio3DraftMap(map, incoming) {
  const out = { ...map };
  for (const [memberId, draft] of Object.entries(incoming ?? {})) {
    if (!draft || typeof draft !== 'object') continue;
    const normalized = normalizeStudio3Draft(draft);
    const existing = out[memberId];
    const existingAt = String(existing?.draftUpdatedAt ?? '');
    const draftAt = String(normalized.draftUpdatedAt ?? '');
    if (!existing || draftAt >= existingAt) out[memberId] = normalized;
  }
  return out;
}

/** @param {import('./week2FecValidationTypes.js').FecValidationSquadState} local @param {import('./week2FecValidationTypes.js').FecValidationSquadState} remote */
export function mergeStudio2DraftMaps(local, remote) {
  return mergeStudio2DraftMap(
    mergeStudio2DraftMap({}, local?.studio2DraftsByMember),
    remote?.studio2DraftsByMember,
  );
}

/** @param {import('./week2FecValidationTypes.js').FecValidationSquadState} local @param {import('./week2FecValidationTypes.js').FecValidationSquadState} remote */
export function mergeStudio3DraftMaps(local, remote) {
  return mergeStudio3DraftMap(
    mergeStudio3DraftMap({}, local?.studio3DraftsByMember),
    remote?.studio3DraftsByMember,
  );
}

/** @param {import('./week2FecValidationTypes.js').FecValidationSquadState} local @param {import('./week2FecValidationTypes.js').FecValidationSquadState} remote */
export function mergeStudioSourceMaps(local, remote) {
  return {
    studio2SourceByMember: { ...(local?.studio2SourceByMember ?? {}), ...(remote?.studio2SourceByMember ?? {}) },
    studio3SourceByMember: { ...(local?.studio3SourceByMember ?? {}), ...(remote?.studio3SourceByMember ?? {}) },
  };
}
