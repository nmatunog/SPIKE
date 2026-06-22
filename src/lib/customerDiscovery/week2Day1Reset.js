/**
 * One-time reset for Week 2 Day 1 squad mission workshop.
 * Clears bad auto-complete state (pre-filled default questions counted as done).
 */
import { upsertBlueprintEntry } from '../supabase/blueprintEntries.js';
import { isMockUserId } from '../mockAuth.js';
import { resetWeek2Discovery } from './week2DiscoveryStorage.js';

const LEGACY_STORAGE_KEY = 'spike_week2_discovery_v1';
const RESET_FLAG_PREFIX = 'spike_week2_day1_workshop_reset_v1';

const WEEK2_PORTFOLIO_FIELDS = [
  'customer_discovery_prep',
  'assigned_squad',
  'customer_segment',
  'interview_questions',
  'dream_connection',
];

const ARTIFACTS_KEY = 'spike_blueprint_artifacts';
const TIMELINE_KEY = 'spike_blueprint_timeline';
const SECTIONS_KEY = 'spike_blueprint_section_entries';

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

function writeJson(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/** @param {string} participantId */
function clearWeek2PortfolioArtifacts(participantId) {
  const all = readJson(ARTIFACTS_KEY);
  const user = all[participantId];
  if (!user?.portfolio?.length) return;

  user.portfolio = user.portfolio.filter(
    (a) => !(a.sourceType === 'week2-discovery' && a.sourceId === 'day1-prep'),
  );
  all[participantId] = user;
  writeJson(ARTIFACTS_KEY, all);
}

/** @param {string} participantId */
function clearWeek2TimelineEvents(participantId) {
  const all = readJson(TIMELINE_KEY);
  const list = all[participantId];
  if (!Array.isArray(list) || !list.length) return;

  all[participantId] = list.filter((evt) => evt.type !== 'week2_discovery');
  writeJson(TIMELINE_KEY, all);
}

/**
 * @param {string} participantId
 * @returns {string[]}
 */
function clearWeek2BlueprintSectionFields(participantId) {
  const all = readJson(SECTIONS_KEY);
  const section = all[participantId]?.['market-intelligence'];
  if (!section) return [];

  const cleared = [];
  for (const fieldKey of WEEK2_PORTFOLIO_FIELDS) {
    const entry = section[fieldKey];
    if (entry?.sourceType === 'week2-discovery') {
      delete section[fieldKey];
      cleared.push(fieldKey);
    }
  }
  writeJson(SECTIONS_KEY, all);
  return cleared;
}

/**
 * @param {string} participantId
 * @param {string[]} fieldKeys
 */
async function clearWeek2BlueprintSectionFieldsCloud(participantId, fieldKeys) {
  if (!fieldKeys.length || isMockUserId(participantId)) return;

  await Promise.all(
    fieldKeys.map((fieldKey) =>
      upsertBlueprintEntry(participantId, 'market-intelligence', fieldKey, '', {
        sourceType: 'week2-discovery',
        sourceId: 'day1-prep-reset',
      }),
    ),
  );
}

/**
 * Wipe Week 2 Day 1 workshop progress and any auto-synced portfolio prep.
 * @param {string} participantId
 */
export async function resetWeek2Day1Workshop(participantId) {
  if (!participantId || typeof localStorage === 'undefined') return { cleared: false };

  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* private mode */
  }

  resetWeek2Discovery(participantId);
  clearWeek2PortfolioArtifacts(participantId);
  clearWeek2TimelineEvents(participantId);
  const clearedFields = clearWeek2BlueprintSectionFields(participantId);

  try {
    await clearWeek2BlueprintSectionFieldsCloud(participantId, clearedFields);
  } catch (err) {
    console.warn('[week2Day1Reset] cloud clear skipped:', err);
  }

  return { cleared: true, clearedFields };
}

/**
 * Run once per participant after deploy — full Week 2 Day 1 workshop reset.
 * @param {string} participantId
 */
export async function maybeResetWeek2Day1Workshop(participantId) {
  if (!participantId || isMockUserId(participantId)) return false;

  const flagKey = `${RESET_FLAG_PREFIX}:${participantId}`;
  try {
    if (localStorage.getItem(flagKey)) return false;
  } catch {
    return false;
  }

  await resetWeek2Day1Workshop(participantId);
  try {
    localStorage.setItem(flagKey, new Date().toISOString());
  } catch {
    /* ignore */
  }
  return true;
}
