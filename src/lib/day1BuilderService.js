/**
 * Venture Blueprint Builders™ — Day 1 completion and Blueprint sync.
 */
import { DAY1_ID, MOTIVATION_CARDS } from './day1BuilderConstants.js';
import { setSectionField } from './blueprintSectionStore.js';
import {
  markActivityCompleted,
  markWorksheetCompleted,
} from './playbookProgress.js';
import { syncPlaybookWorksheet } from './playbookBlueprintSync.js';
import { generateSquadCharterPdf } from './squadCharterService.js';
import {
  getAllDay1BuilderData,
  getDay1MissionProgress,
  isBuilderCompleted,
  readBuilderEntry,
  writeBuilderEntry,
} from './day1BuilderStorage.js';

export { getDay1MissionProgress, isBuilderCompleted, getAllDay1BuilderData };

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
    case 'discover-why':
      syncDiscoverWhy(participantId, data);
      break;
    case 'design-future':
      syncDesignFuture(participantId, data);
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
function syncDiscoverWhy(participantId, data) {
  const cards = /** @type {string[]} */ (data.motivationCards ?? []);
  const labels = cards
    .map((id) => MOTIVATION_CARDS.find((c) => c.id === id)?.label)
    .filter(Boolean);
  const joinReason = String(data.joinReason ?? '').trim();
  const personalWhy = [
    labels.length ? `Motivated by: ${labels.join(', ')}.` : '',
    joinReason ? `Why SPIKE: ${joinReason}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  setSectionField(participantId, 'vision-purpose', 'mission_statement', personalWhy, {
    sourceType: 'day1_builder',
    sourceId: 'discover-why',
  });

  const legacyAnswers = {
    'wq-day-1-why-1': personalWhy,
    'wq-day-1-why-2': joinReason,
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
function syncDesignFuture(participantId, data) {
  const narrative = buildFutureNarrative(data);
  setSectionField(participantId, 'vision-purpose', 'future_self_narrative', narrative, {
    sourceType: 'day1_builder',
    sourceId: 'design-future',
  });
  setSectionField(participantId, 'vision-purpose', 'vision_statement', String(data.impactGoal ?? ''), {
    sourceType: 'day1_builder',
    sourceId: 'design-future',
  });
}

/** @param {Record<string, unknown>} data */
function buildFutureNarrative(data) {
  return [
    `In 10 years, I see myself living in ${data.livingLocation || 'my chosen community'}.`,
    `I aim for ${data.targetIncome || 'sustainable income'} while building ${data.careerVision || 'my financial services practice'}.`,
    `The impact I want to create: ${data.impactGoal || 'helping families achieve financial security'}.`,
  ].join(' ');
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

  void generateSquadCharterPdf(participantId, data);
}

/** @param {number} week @param {number} segment */
export function isDay1MissionActive(week, segment) {
  return segment === 1 && week <= 1;
}
