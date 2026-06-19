/**
 * Venture Blueprint Builders™ — Day 1 completion and Blueprint sync.
 */
import { DAY1_ID } from './day1BuilderConstants.js';
import { setSectionFieldCloudFirst } from './blueprintSectionStore.js';
import {
  markActivityCompleted,
  markWorksheetCompleted,
} from './playbookProgress.js';
import { syncPlaybookWorksheet } from './playbookBlueprintSync.js';
import {
  getAllDay1BuilderData,
  getDay1MissionProgress,
  isBuilderCompleted,
  isBuilderEditLocked,
  canRefineBuilder,
  startBuilderRefinement,
  readBuilderEntry,
  writeBuilderEntry,
  clearBuilderEntry,
} from './day1BuilderStorage.js';
import { persistBuilderEntryCloudFirst } from './day1BuilderSync.js';
import { fetchDreamBoardAssets } from './supabase/dreamBoardAssets.js';
import { canWriteParticipantRow } from './supabase/writeGuards.js';
import { buildDreamBoardSyncMessage, dreamBoardSyncStats } from './dreamBoardSyncMessage.js';
import {
  hasInlineDreamBoardImages,
  stripInlineDreamBoardData,
} from './dreamBoardLocalCache.js';
import { upgradeLocalDreamBoardInlineImages } from './dreamBoardCloudSync.js';
import { isMockUserId } from './mockAuth.js';

const DRAFT_CLOUD_DEBOUNCE_MS = 2000;

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const draftCloudTimers = new Map();

function draftTimerKey(participantId, builderId) {
  return `${participantId}:${builderId}`;
}

function clearDraftCloudTimer(participantId, builderId) {
  const key = draftTimerKey(participantId, builderId);
  const timer = draftCloudTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    draftCloudTimers.delete(key);
  }
}

export {
  getDay1MissionProgress,
  isBuilderCompleted,
  isBuilderEditLocked,
  canRefineBuilder,
  startBuilderRefinement,
  getAllDay1BuilderData,
  readBuilderEntry,
};

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
  let storeData = data;
  if (builderId === 'dream-board' && hasInlineDreamBoardImages(data) && !isMockUserId(participantId)) {
    storeData = stripInlineDreamBoardData(data);
    void upgradeLocalDreamBoardInlineImages(participantId, data).catch((err) => {
      console.warn('[day1Builder] dream board inline upgrade failed:', err instanceof Error ? err.message : err);
    });
  }

  writeBuilderEntry(participantId, builderId, storeData, false);

  const key = draftTimerKey(participantId, builderId);
  const existing = draftCloudTimers.get(key);
  if (existing) clearTimeout(existing);

  draftCloudTimers.set(
    key,
    setTimeout(() => {
      draftCloudTimers.delete(key);
      const latest = readBuilderEntry(participantId, builderId)?.data ?? data;
      void persistBuilderEntryCloudFirst(participantId, builderId, latest, false).catch((err) => {
        console.warn('[day1Builder] draft cloud save failed:', err instanceof Error ? err.message : err);
      });
    }, DRAFT_CLOUD_DEBOUNCE_MS),
  );
}

/**
 * @param {string} participantId
 * @param {string} builderId
 * @param {Record<string, unknown>} data
 */
export async function completeDay1Builder(participantId, builderId, data) {
  clearDraftCloudTimer(participantId, builderId);
  await persistBuilderEntryCloudFirst(participantId, builderId, data, true);
  await syncBuilderToBlueprint(participantId, builderId, data);
}

/**
 * Force dream board captions + photos to Supabase (manual repair / re-sync).
 * @param {string} participantId
 * @param {Record<string, unknown>} data
 * @returns {Promise<{ ok: boolean, message: string, cardCount: number, captionCount: number, localPhotoCount: number, cloudPhotoCount: number, error?: string }>}
 */
export async function repairDreamBoardCloudSync(participantId, data) {
  const stats = dreamBoardSyncStats(/** @type {Array<{ caption?: string, imageUrl?: string }>} */ (data?.assets));

  if (!participantId || isMockUserId(participantId)) {
    return {
      ok: false,
      ...stats,
      message: 'Sign in with your intern account to sync your dream board.',
    };
  }

  if (stats.cardCount === 0) {
    return { ok: false, ...stats, message: buildDreamBoardSyncMessage(stats) };
  }

  if (!(await canWriteParticipantRow(participantId))) {
    return {
      ok: false,
      ...stats,
      message: 'Could not sync — sign out, sign in again, then tap Sync to cloud.',
    };
  }

  clearDraftCloudTimer(participantId, 'dream-board');
  const existing = readBuilderEntry(participantId, 'dream-board');
  const completed = Boolean(existing?.completedAt);

  writeBuilderEntry(participantId, 'dream-board', stripInlineDreamBoardData(data), completed, { force: true });

  try {
    await persistBuilderEntryCloudFirst(participantId, 'dream-board', data, completed, { force: true });
    const cloudRows = await fetchDreamBoardAssets(participantId);
    const cloudPhotoCount = cloudRows.filter((row) => String(row.image_url ?? '').trim()).length;
    const result = { ...stats, cloudPhotoCount };
    const message = buildDreamBoardSyncMessage(result);
    const ok = cloudPhotoCount > 0 || (stats.localPhotoCount === 0 && stats.captionCount > 0);
    return { ok, message, ...result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      ...stats,
      cloudPhotoCount: 0,
      error: message,
      message: `Sync failed: ${message}`,
    };
  }
}

/**
 * @param {string} participantId
 * @param {string} builderId
 * @param {Record<string, unknown>} data
 */
async function syncBuilderToBlueprint(participantId, builderId, data) {
  switch (builderId) {
    case 'ambition-builder':
      await syncAmbition(participantId, data);
      break;
    case 'impact-builder':
    case 'purpose-builder':
      await syncImpact(participantId, data);
      break;
    case 'values-builder':
      await syncValues(participantId, data);
      break;
    case 'future-self':
      await syncFutureSelf(participantId, data);
      break;
    case 'dream-board':
      await syncDreamBoard(participantId, data);
      break;
    case 'future-venture':
      await syncFutureVenture(participantId, data);
      break;
    case 'squad-formation':
      await syncSquadFormation(participantId, data);
      break;
    case 'squad-charter':
      await syncSquadCharter(participantId, data);
      break;
    default:
      break;
  }
}

/** @param {string} participantId @param {Record<string, unknown>} data */
async function syncAmbition(participantId, data) {
  const statement = String(data.ambitionStatement ?? '').trim();
  await setSectionFieldCloudFirst(participantId, 'vision-purpose', 'vision_statement', statement, {
    sourceType: 'day1_builder',
    sourceId: 'ambition-builder',
  });
}

/** @param {string} participantId @param {Record<string, unknown>} data */
async function syncImpact(participantId, data) {
  const impact = String(data.impactStatement ?? data.purposeStatement ?? '').trim();
  await setSectionFieldCloudFirst(participantId, 'vision-purpose', 'mission_statement', impact, {
    sourceType: 'day1_builder',
    sourceId: 'impact-builder',
  });

  const legacyAnswers = {
    'wq-day-1-why-1': impact,
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
async function syncValues(participantId, data) {
  const profile = String(data.valuesProfile ?? '').trim();
  await setSectionFieldCloudFirst(participantId, 'vision-purpose', 'my_values', profile, {
    sourceType: 'day1_builder',
    sourceId: 'values-builder',
  });
}

/** @param {string} participantId @param {Record<string, unknown>} data */
async function syncFutureSelf(participantId, data) {
  const narrative = String(data.futureSelfNarrative ?? '').trim();
  await setSectionFieldCloudFirst(participantId, 'vision-purpose', 'future_self_narrative', narrative, {
    sourceType: 'day1_builder',
    sourceId: 'future-self',
  });
}

/** @param {string} participantId @param {Record<string, unknown>} data */
async function syncDreamBoard(participantId, data) {
  const assets = /** @type {Array<{ category: string, caption: string }>} */ (data.assets ?? []);
  const summary = assets.map((a) => `• [${a.category}] ${a.caption}`).join('\n');
  await setSectionFieldCloudFirst(participantId, 'vision-purpose', 'dream_board', summary, {
    sourceType: 'day1_builder',
    sourceId: 'dream-board',
  });
  markActivityCompleted(participantId, 'activity-day-1-vision-board', DAY1_ID, {
    title: 'Dream Board Studio',
    outputs: ['Dream board assets'],
  });
}

/** @param {string} participantId @param {Record<string, unknown>} data */
async function syncFutureVenture(participantId, data) {
  const path = String(data.pathPreference ?? 'undecided');
  const label =
    path === 'agency_builder'
      ? 'Agency Builder — build a team and agency'
      : path === 'specialist_consultant'
        ? 'Specialist Consultant — build expertise and niche practice'
        : 'Still exploring career path options';
  await setSectionFieldCloudFirst(participantId, 'career-accelerator', 'career_interest_explored', label, {
    sourceType: 'day1_builder',
    sourceId: 'future-venture',
  });
}

/** @param {string} participantId @param {Record<string, unknown>} data */
async function syncSquadFormation(participantId, data) {
  const markets = /** @type {string[]} */ (data.marketPreferences ?? []);
  await setSectionFieldCloudFirst(
    participantId,
    'vision-purpose',
    'squad_market_preferences',
    markets.join(', '),
    { sourceType: 'day1_builder', sourceId: 'squad-formation' },
  );
}

/** @param {string} participantId @param {Record<string, unknown>} data */
async function syncSquadCharter(participantId, data) {
  const charterText = [
    `Squad: ${data.squadName}`,
    `Mission: ${data.mission}`,
    `Motto: ${data.teamMotto}`,
    `Commitment: ${data.teamCommitment}`,
    `Signed: ${data.signatureName} on ${data.signedAt ?? new Date().toISOString()}`,
  ].join('\n');

  await setSectionFieldCloudFirst(participantId, 'vision-purpose', 'squad_charter', charterText, {
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

import { UNLOCK_WEEK1_DAY2_PLUS } from './programUnlocks.js';

/** @param {number} week @param {number} segment @param {number} [day] */
export function isDay1MissionActive(week, segment, day = 1) {
  if (UNLOCK_WEEK1_DAY2_PLUS && segment === 1 && week <= 1) return false;
  return segment === 1 && week <= 1 && day <= 1;
}

/** Week 1 playbook days 2–5 (segment 1) — industry, market, entrepreneur, commitment. */
export function isWeek1PlaybookDaysActive(week, segment, day = 1) {
  return segment === 1 && week <= 1 && day >= 2 && day <= 5;
}
