/**
 * Venture Blueprint Builders™ — Day 1 completion and Blueprint sync.
 */
import { DAY1_ID } from './day1BuilderConstants.js';
import { setSectionField } from './blueprintSectionStore.js';
import {
  markActivityCompleted,
  markWorksheetCompleted,
} from './playbookProgress.js';
import { syncPlaybookWorksheet } from './playbookBlueprintSync.js';
import {
  getAllDay1BuilderData,
  getDay1MissionProgress,
  isBuilderCompleted,
  readBuilderEntry,
  writeBuilderEntry,
  clearBuilderEntry,
} from './day1BuilderStorage.js';

export { getDay1MissionProgress, isBuilderCompleted, getAllDay1BuilderData };

/** @param {string} participantId @param {string} builderId */
export function resetDay1Builder(participantId, builderId) {
  clearBuilderEntry(participantId, builderId);
}

/** @param {string} participantId @param {string} builderId */
export function getBuilderData(participantId, builderId) {
  return readBuilderEntry(participantId, builderId)?.data ?? null;
}

/**
 * @param {string} participantId
 * @param {string} builderId
 * @param {Record<string, unknown>} data
 */
export function saveBuilderDraft(participantId, builderId, data) {
  writeBuilderEntry(participantId, builderId, data, false);
}

/**
 * @param {string} participantId
 * @param {string} builderId
 * @param {Record<string, unknown>} data
 */
export function completeDay1Builder(participantId, builderId, data) {
  writeBuilderEntry(participantId, builderId, data, true);
  syncBuilderToBlueprint(participantId, builderId, data);
}

/**
 * @param {string} participantId
 * @param {string} builderId
 * @param {Record<string, unknown>} data
 */
function syncBuilderToBlueprint(participantId, builderId, data) {
  switch (builderId) {
    case 'ambition-builder':
      syncAmbition(participantId, data);
      break;
    case 'purpose-builder':
      syncPurpose(participantId, data);
      break;
    case 'values-builder':
      syncValues(participantId, data);
      break;
    case 'future-self':
      syncFutureSelf(participantId, data);
      break;
    case 'dream-board':
      syncDreamBoard(participantId, data);
      break;
    case 'future-venture':
      syncFutureVenture(participantId, data);
      break;
    case 'squad-formation':
      syncSquadFormation(participantId, data);
      break;
    case 'squad-charter':
      syncSquadCharter(participantId, data);
      break;
    default:
      break;
  }
}

/** @param {string} participantId @param {Record<string, unknown>} data */
function syncAmbition(participantId, data) {
  const statement = String(data.ambitionStatement ?? '').trim();
  setSectionField(participantId, 'vision-purpose', 'vision_statement', statement, {
    sourceType: 'day1_builder',
    sourceId: 'ambition-builder',
  });
}

/** @param {string} participantId @param {Record<string, unknown>} data */
function syncPurpose(participantId, data) {
  const purpose = String(data.purposeStatement ?? '').trim();
  setSectionField(participantId, 'vision-purpose', 'mission_statement', purpose, {
    sourceType: 'day1_builder',
    sourceId: 'purpose-builder',
  });

  const legacyAnswers = {
    'wq-day-1-why-1': purpose,
    'wq-day-1-why-2': String(data.whyImportant ?? ''),
    'wq-day-1-why-3': 4,
    'wq-day-1-why-4': true,
  };
  markWorksheetCompleted(participantId, 'worksheet-day-1-personal-why', legacyAnswers, DAY1_ID);
  syncPlaybookWorksheet(
    participantId,
    'worksheet-day-1-personal-why',
    legacyAnswers,
    [],
  );
}

/** @param {string} participantId @param {Record<string, unknown>} data */
function syncValues(participantId, data) {
  const profile = String(data.valuesProfile ?? '').trim();
  setSectionField(participantId, 'vision-purpose', 'my_values', profile, {
    sourceType: 'day1_builder',
    sourceId: 'values-builder',
  });
}

/** @param {string} participantId @param {Record<string, unknown>} data */
function syncFutureSelf(participantId, data) {
  const narrative = String(data.futureSelfNarrative ?? '').trim();
  setSectionField(participantId, 'vision-purpose', 'future_self_narrative', narrative, {
    sourceType: 'day1_builder',
    sourceId: 'future-self',
  });
}

/** @param {string} participantId @param {Record<string, unknown>} data */
function syncDreamBoard(participantId, data) {
  const assets = /** @type {Array<{ category: string, caption: string }>} */ (data.assets ?? []);
  const summary = assets.map((a) => `• [${a.category}] ${a.caption}`).join('\n');
  setSectionField(participantId, 'vision-purpose', 'dream_board', summary, {
    sourceType: 'day1_builder',
    sourceId: 'dream-board',
  });
  markActivityCompleted(participantId, 'activity-day-1-vision-board', DAY1_ID, {
    title: 'Dream Board Studio',
    outputs: ['Dream board assets'],
  });
}

/** @param {string} participantId @param {Record<string, unknown>} data */
function syncFutureVenture(participantId, data) {
  const path = String(data.pathPreference ?? 'undecided');
  const label =
    path === 'agency_builder'
      ? 'Agency Builder — build a team and agency'
      : path === 'specialist_consultant'
        ? 'Specialist Consultant — build expertise and niche practice'
        : 'Still exploring career path options';
  setSectionField(participantId, 'career-accelerator', 'career_interest_explored', label, {
    sourceType: 'day1_builder',
    sourceId: 'future-venture',
  });
}

/** @param {string} participantId @param {Record<string, unknown>} data */
function syncSquadFormation(participantId, data) {
  const markets = /** @type {string[]} */ (data.marketPreferences ?? []);
  setSectionField(
    participantId,
    'vision-purpose',
    'squad_market_preferences',
    markets.join(', '),
    { sourceType: 'day1_builder', sourceId: 'squad-formation' },
  );
}

/** @param {string} participantId @param {Record<string, unknown>} data */
function syncSquadCharter(participantId, data) {
  const charterText = [
    `Squad: ${data.squadName}`,
    `Mission: ${data.mission}`,
    `Motto: ${data.teamMotto}`,
    `Commitment: ${data.teamCommitment}`,
    `Signed: ${data.signatureName} on ${data.signedAt ?? new Date().toISOString()}`,
  ].join('\n');

  setSectionField(participantId, 'vision-purpose', 'squad_charter', charterText, {
    sourceType: 'day1_builder',
    sourceId: 'squad-charter',
  });

  markActivityCompleted(participantId, 'activity-day-1-squad-charter', DAY1_ID, {
    title: 'Squad Charter',
    outputs: ['Digital charter signature'],
  });

  void import('./squadCharterService.js').then(({ generateSquadCharterPdf }) =>
    generateSquadCharterPdf(participantId, data),
  );
}

/** @param {number} week @param {number} segment */
export function isDay1MissionActive(week, segment) {
  return segment === 1 && week <= 1;
}
