/**
 * Week 3 Day 5 — load/suggest/save simplified FEC pitch copy for boxes 4–7.
 * Never deletes existing FEC data; suggests shorter pitch versions when content is long.
 */
import { approveFecStep } from './customerDiscovery/week2FecValidationService.js';
import { loadFecValidation, saveFecValidation } from './customerDiscovery/week2FecValidationStorage.js';
import { getSquadNameForParticipant } from './customerDiscovery/week2SquadEvidenceService.js';
import { createPortfolioArtifactDraft } from './blueprintArtifacts.js';
import { appendBlueprintTimelineEvent } from './blueprintTimeline.js';
import { getFecField, saveFecField } from './fecCanvasService.js';
import { loadWeek3Day3Portfolio } from './week3Day3PortfolioService.js';
import { getWeek3Day3FecBoxDisplayText } from './week3Day3FecBoxContent.js';
import { loadGrowthEngineWorksheet } from './growthEngineWorksheet/storage.js';
import { GROWTH_STRATEGY_OPTIONS } from './growthEngineWorksheet/types.js';
import { getWeek3Day5PitchBoxDef, WEEK3_DAY5_PITCH_BOXES } from './week3Day5FecPitchBoxes.js';

const PITCH_DRAFT_STORAGE_KEY = 'spike-week3-day5-fec-pitch';

const LONG_TEXT_MIN_CHARS = 260;
const LONG_TEXT_MIN_LINES = 5;

/** @param {unknown} text */
export function isLongFecPitchText(text) {
  const raw = String(text ?? '').trim();
  if (!raw) return false;
  if (raw.length >= LONG_TEXT_MIN_CHARS) return true;
  if (raw.includes('##') || raw.includes('**')) return true;
  if ((raw.match(/\n/g) || []).length >= LONG_TEXT_MIN_LINES) return true;
  const sentences = raw.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  return sentences.length > 4;
}

/** @param {unknown} text @param {number} [maxChars] */
export function suggestShortPitchText(text, maxChars = 280) {
  const raw = String(text ?? '').trim();
  if (!raw) return '';

  const withoutHeaders = raw
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\r/g, '')
    .trim();

  const bulletLines = withoutHeaders
    .split('\n')
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);

  if (bulletLines.length >= 2) {
    const bullets = bulletLines.slice(0, 4).map((line) => `• ${line}`);
    const joined = bullets.join('\n');
    return joined.length <= maxChars ? joined : `${joined.slice(0, maxChars - 1)}…`;
  }

  const sentences = withoutHeaders
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length >= 2) {
    const short = `${sentences[0]} ${sentences[1]}`.trim();
    return short.length <= maxChars ? short : `${short.slice(0, maxChars - 1)}…`;
  }

  if (withoutHeaders.length <= maxChars) return withoutHeaders;
  const cut = withoutHeaders.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  const trimmed = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed}…`;
}

/** @param {unknown[]} parts */
function joinParts(parts) {
  return parts.map((p) => String(p ?? '').trim()).filter(Boolean).join('\n');
}

/** @param {string} participantId @param {import('./week3Day5FecPitchBoxes.js').Week3Day5PitchBoxId} boxId */
function readSavedFecText(participantId, boxId) {
  if (boxId === 'client_experience') {
    return getWeek3Day3FecBoxDisplayText(participantId, 'client_experience');
  }
  if (boxId === 'winning_strategy') {
    const validated = getWeek3Day3FecBoxDisplayText(participantId, 'winning_strategy');
    if (validated) return validated;
    const def = getWeek3Day5PitchBoxDef('winning_strategy');
    return String(getFecField(participantId, def.engineKey, def.fieldKey) ?? '').trim();
  }
  if (boxId === 'growth_engines') {
    const def = getWeek3Day5PitchBoxDef('growth_engines');
    const primary = String(getFecField(participantId, def.engineKey, def.fieldKey) ?? '').trim();
    if (primary) return primary;
    const talent = String(getFecField(participantId, 'agency_talent', 'talent_development_system') ?? '').trim();
    const expansion = String(getFecField(participantId, 'agency_leadership', 'expansion_strategy') ?? '').trim();
    return joinParts([talent, expansion]);
  }
  if (boxId === 'key_partners') {
    const def = getWeek3Day5PitchBoxDef('key_partners');
    return String(getFecField(participantId, def.engineKey, def.fieldKey) ?? '').trim();
  }
  return '';
}

/** @param {string} participantId @param {import('./week3Day5FecPitchBoxes.js').Week3Day5PitchBoxId} boxId */
export function buildWeek3Day5PitchSuggestion(participantId, boxId) {
  if (!participantId) return '';

  const day3 = loadWeek3Day3Portfolio(participantId);
  const growth = loadGrowthEngineWorksheet(participantId);
  const strategyLabel = GROWTH_STRATEGY_OPTIONS.find((o) => o.id === growth.growthStrategy)?.label ?? '';

  if (boxId === 'client_experience') {
    return suggestShortPitchText(
      joinParts([
        day3.clientExperienceVision,
        day3.whatBuildsTrust ? `Trust builders: ${day3.whatBuildsTrust}` : '',
        day3.whatWorked ? `What works: ${day3.whatWorked}` : '',
      ]),
      320,
    );
  }

  if (boxId === 'winning_strategy') {
    return suggestShortPitchText(
      joinParts([
        day3.whyChoosePractice,
        growth.growthStrategyReflection,
        strategyLabel ? `Growth focus: ${strategyLabel}` : '',
        growth.growthStrategyOther ? `Strategy: ${growth.growthStrategyOther}` : '',
      ]),
      320,
    );
  }

  if (boxId === 'growth_engines') {
    const year1Target = growth.targets?.yearRevenueGoal
      ? `Year 1 target: ₱${Number(growth.targets.yearRevenueGoal).toLocaleString()} · ${growth.targets.requiredClients || '?'} clients`
      : '';
    return suggestShortPitchText(
      joinParts([
        growth.developLeaders ? `Leaders: ${growth.developLeaders}` : '',
        growth.buildSystems ? `Systems: ${growth.buildSystems}` : '',
        growth.increaseCapacity ? `Capacity: ${growth.increaseCapacity}` : '',
        growth.expandMarket ? `Market: ${growth.expandMarket}` : '',
        growth.fecYear1Launch ? `Year 1: ${growth.fecYear1Launch}` : '',
        year1Target,
        growth.longTermVision ? `Vision: ${growth.longTermVision}` : '',
      ]),
      360,
    );
  }

  if (boxId === 'key_partners') {
    return suggestShortPitchText(
      joinParts([
        day3.whyChoosePractice,
        'AIA as business platform: training, mentoring, technology, products, brand, compliance, licensing, support.',
      ]),
      320,
    );
  }

  return '';
}

function readPitchDraftStore() {
  try {
    const raw = localStorage.getItem(PITCH_DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePitchDraftStore(data) {
  localStorage.setItem(PITCH_DRAFT_STORAGE_KEY, JSON.stringify(data));
}

/** @param {string} participantId */
export function loadWeek3Day5PitchDrafts(participantId) {
  if (!participantId) return {};
  const row = readPitchDraftStore()[participantId];
  return row && typeof row === 'object' ? { ...row } : {};
}

/**
 * @param {string} participantId
 * @param {import('./week3Day5FecPitchBoxes.js').Week3Day5PitchBoxId} boxId
 * @param {string} text
 */
export function saveWeek3Day5PitchDraft(participantId, boxId, text) {
  if (!participantId) return;
  const all = readPitchDraftStore();
  const drafts = { ...(all[participantId] ?? {}), [boxId]: String(text ?? '').trim() };
  all[participantId] = { ...drafts, updatedAt: new Date().toISOString() };
  writePitchDraftStore(all);
}

/**
 * @param {string} participantId
 * @param {import('./week3Day5FecPitchBoxes.js').Week3Day5PitchBoxId} boxId
 */
export function getWeek3Day5PitchBoxState(participantId, boxId) {
  const def = getWeek3Day5PitchBoxDef(boxId);
  const savedFec = readSavedFecText(participantId, boxId);
  const suggestion = buildWeek3Day5PitchSuggestion(participantId, boxId);
  const drafts = loadWeek3Day5PitchDrafts(participantId);
  const draftText = String(drafts[boxId] ?? '').trim();

  const editorSeed = draftText || savedFec || suggestion;
  const shortenSuggestion = savedFec && isLongFecPitchText(savedFec)
    ? suggestShortPitchText(savedFec, def?.maxPitchChars ?? 280)
    : '';

  return {
    boxId,
    def,
    savedFec,
    suggestion,
    draftText,
    editorSeed,
    shortenSuggestion,
    needsShorten: Boolean(savedFec && isLongFecPitchText(savedFec)),
    hasSavedFec: Boolean(savedFec),
    sourceLabel: draftText
      ? 'Your pitch draft'
      : savedFec
        ? 'Saved in FEC'
        : suggestion
          ? 'Suggested from Day 3–4'
          : 'Start typing',
  };
}

/** @param {string} participantId */
export function getWeek3Day5PitchOverview(participantId) {
  return WEEK3_DAY5_PITCH_BOXES.map((box) => getWeek3Day5PitchBoxState(participantId, box.id));
}

/** @param {string} participantId */
function squadKeyFor(participantId) {
  return getSquadNameForParticipant(participantId) || `solo-${participantId}`;
}

/**
 * Update validation overlay for pitch display without overwriting unrelated FEC fields.
 * @param {string} participantId
 * @param {string} boxId
 * @param {string} text
 */
function patchPitchBoxScore(participantId, boxId, text) {
  const key = squadKeyFor(participantId);
  const fec = loadFecValidation(key);
  saveFecValidation(key, {
    boxScores: {
      ...fec.boxScores,
      [boxId]: {
        ...fec.boxScores?.[boxId],
        approvedText: text,
        status: 'Pitch ready',
      },
    },
  });
}

/**
 * @param {string} participantId
 * @param {import('./week3Day5FecPitchBoxes.js').Week3Day5PitchBoxId} boxId
 * @param {string} text
 */
export function saveWeek3Day5PitchBoxToFec(participantId, boxId, text) {
  const def = getWeek3Day5PitchBoxDef(boxId);
  const trimmed = String(text ?? '').trim();
  if (!participantId || !def || !trimmed) return false;

  saveFecField(participantId, def.engineKey, def.fieldKey, trimmed);

  if (boxId === 'client_experience' && def.fecStepId) {
    approveFecStep(participantId, def.fecStepId, {
      approvedStatement: trimmed,
      afterText: trimmed,
    });
  } else if (boxId === 'winning_strategy') {
    patchPitchBoxScore(participantId, 'winning_strategy', trimmed);
  }

  saveWeek3Day5PitchDraft(participantId, boxId, trimmed);
  syncWeek3Day5PitchToPortfolio(participantId);
  return true;
}

/** @param {string} participantId */
function syncWeek3Day5PitchToPortfolio(participantId) {
  if (!participantId) return;

  const overview = getWeek3Day5PitchOverview(participantId);
  const content = overview
    .map((box) => {
      const text = String(box.draftText || box.savedFec || '').trim() || '_Pending_';
      return `## Box ${box.def.number} — ${box.def.label}\n\n${text}`;
    })
    .join('\n\n---\n\n');

  createPortfolioArtifactDraft({
    participantId,
    sectionId: 'portfolio-advisor-startup',
    title: 'Financial Advisory Venture Pitch (FEC Boxes 4–7)',
    content,
    sourceType: 'week3_day5_fec_pitch',
    sourceId: 'week-3-day-5',
  });

  appendBlueprintTimelineEvent(participantId, {
    type: 'week3_day5_pitch',
    title: 'Venture pitch copy updated',
    detail: isWeek3Day5PitchReady(participantId)
      ? 'All four FEC pitch boxes ready for Day 15'
      : 'Pitch draft saved — complete all four boxes before you pitch',
    week: 3,
    day: 5,
  });
}

/** @param {string} participantId */
export function isWeek3Day5PitchReady(participantId) {
  const overview = getWeek3Day5PitchOverview(participantId);
  return overview.every((box) => {
    const text = String(box.draftText || box.savedFec || '').trim();
    return text.length >= 24;
  });
}
