/**
 * Week 2 pitch panel — live aggregation, finalize, mentor proxy, XP mapping.
 */
import {
  PITCH_PANEL_FINAL_STORAGE_KEY,
  PITCH_PANEL_LIVE_STORAGE_KEY,
  PITCH_PANEL_SESSION_ID,
  PITCH_PANEL_WEEK,
} from './pitchPanelConstants.js';
import { SQUAD_XP_WEEK2_PANEL_MAX } from './squadXpConstants.js';
import {
  fetchPitchPanelStateRemote,
  finalizePitchPanelRemote,
} from '../supabase/pitchPanel.js';
import { getParticipantSquad } from '../cohortFormationService.js';
import { loadSquadDesignRecord } from '../ventureDesignStudioService.js';
import { loadFecValidation } from '../customerDiscovery/week2FecValidationStorage.js';
import { getSquadNameForParticipant } from '../customerDiscovery/week2SquadEvidenceService.js';
import { loadWeek2Discovery } from '../customerDiscovery/week2DiscoveryStorage.js';

const REVIEW_KEY = 'spike_squad_mentor_review_v1';

function readMentorReview(squadName, week) {
  try {
    const all = JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}');
    return all[`${squadName}:w${week}`] ?? null;
  } catch {
    return null;
  }
}

/** @param {string[]} memberIds */
function squadSubmittedWeek2Pitch(memberIds) {
  const ids = memberIds.filter(Boolean);
  if (!ids.length) return false;
  const squadKey = getSquadNameForParticipant(ids[0]);
  if (squadKey && loadFecValidation(squadKey).pitchSubmittedAt) return true;
  const n = ids.length;
  const submitted = ids.filter((id) => Boolean(loadWeek2Discovery(id).pitchSubmittedAt)).length;
  return submitted / n >= 0.8;
}

/** @param {number | null | undefined} avg */
export function panelAverageToWeek2Xp(avg) {
  if (!avg || avg <= 0) return 0;
  return Math.round((avg / 5) * SQUAD_XP_WEEK2_PANEL_MAX);
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function dispatchPanelEvent(name) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name));
}

/** @returns {{ finalized: boolean, finalizedAt?: string, squads: Record<string, object> } | null} */
export function readFinalizedPanelCache() {
  const raw = readJson(PITCH_PANEL_FINAL_STORAGE_KEY, null);
  if (!raw || raw.sessionId !== PITCH_PANEL_SESSION_ID) return null;
  return raw;
}

/** @param {Record<string, object>} squads */
export function writeFinalizedPanelCache(squads) {
  const entry = {
    sessionId: PITCH_PANEL_SESSION_ID,
    finalizedAt: new Date().toISOString(),
    squads,
  };
  writeJson(PITCH_PANEL_FINAL_STORAGE_KEY, entry);
  dispatchPanelEvent('spike-pitch-panel-finalized');
  return entry;
}

/** @param {object} state */
export function writeLivePanelCache(state) {
  writeJson(PITCH_PANEL_LIVE_STORAGE_KEY, {
    sessionId: PITCH_PANEL_SESSION_ID,
    updatedAt: new Date().toISOString(),
    ...state,
  });
  dispatchPanelEvent('spike-pitch-panel-live');
}

/** @returns {object | null} */
export function readLivePanelCache() {
  const raw = readJson(PITCH_PANEL_LIVE_STORAGE_KEY, null);
  if (!raw || raw.sessionId !== PITCH_PANEL_SESSION_ID) return null;
  return raw;
}

/**
 * @param {string} squadName
 * @param {string[]} memberIds
 * @param {number} [week]
 */
export function computeMentorProxyPanelAverage(squadName, memberIds, week = PITCH_PANEL_WEEK) {
  const review = readMentorReview(squadName, week);
  const vals = Object.values(review?.ratings ?? {}).filter((v) => Number(v) > 0);
  if (vals.length) {
    return vals.reduce((a, b) => a + Number(b), 0) / vals.length;
  }

  const squadRecord = memberIds[0] ? getParticipantSquad(memberIds[0]) : null;
  const squadDesign = loadSquadDesignRecord(squadRecord?.id ?? '');
  if (squadDesign.mentorRating != null && squadDesign.mentorRating > 0) {
    return Number(squadDesign.mentorRating);
  }

  return 3;
}

/**
 * @param {string} squadName
 * @param {string[]} memberIds
 * @param {{ liveAverage?: number | null, scoreCount?: number }} [live]
 * @param {number} [week]
 */
export function resolveSquadPanelResult(squadName, memberIds, live = {}, week = PITCH_PANEL_WEEK) {
  const pitched = squadSubmittedWeek2Pitch(memberIds);
  const hasLive = (live.scoreCount ?? 0) > 0 && (live.liveAverage ?? 0) > 0;

  if (hasLive) {
    const panelAverage = Number(live.liveAverage);
    return {
      squadName,
      panelAverage,
      week2PanelXp: panelAverageToWeek2Xp(panelAverage),
      source: 'panel',
      panelistCount: live.scoreCount ?? 0,
    };
  }

  if (pitched) {
    const panelAverage = computeMentorProxyPanelAverage(squadName, memberIds, week);
    return {
      squadName,
      panelAverage: Math.round(panelAverage * 10) / 10,
      week2PanelXp: panelAverageToWeek2Xp(panelAverage),
      source: 'mentor_proxy',
      panelistCount: 0,
    };
  }

  return {
    squadName,
    panelAverage: null,
    week2PanelXp: 0,
    source: 'none',
    panelistCount: 0,
  };
}

/**
 * @param {string} squadName
 * @param {string[]} [memberIds]
 * @param {number} [week]
 */
export function getSquadPitchPanelSnapshot(squadName, memberIds = [], week = PITCH_PANEL_WEEK) {
  void memberIds;
  void week;
  const finalized = readFinalizedPanelCache();
  const finalRow = finalized?.squads?.[squadName];
  if (finalRow) {
    return {
      squadName,
      panelAverage: finalRow.panelAverage ?? null,
      week2PanelXp: finalRow.week2PanelXp ?? 0,
      provisionalWeek2PanelXp: null,
      finalized: true,
      pending: false,
      source: finalRow.source ?? 'panel',
      panelistCount: finalRow.panelistCount ?? 0,
    };
  }

  const live = readLivePanelCache();
  const liveRow = live?.liveSquads?.[squadName];
  const liveAverage = liveRow?.panelAverage ?? null;
  const scoreCount = liveRow?.scoreCount ?? 0;
  const provisional = liveAverage != null && liveAverage > 0
    ? panelAverageToWeek2Xp(liveAverage)
    : null;

  return {
    squadName,
    panelAverage: liveAverage,
    week2PanelXp: 0,
    provisionalWeek2PanelXp: provisional,
    finalized: false,
    pending: provisional != null,
    source: 'live',
    panelistCount: scoreCount,
  };
}

/** Pull cloud state into local cache for XP cards. */
export async function syncPitchPanelFromCloud() {
  const remote = await fetchPitchPanelStateRemote(PITCH_PANEL_SESSION_ID);
  if (!remote) return null;

  if (remote.finalized && remote.squadResults && typeof remote.squadResults === 'object') {
    writeFinalizedPanelCache(remote.squadResults);
    return remote;
  }

  writeLivePanelCache({
    finalized: false,
    liveSquads: remote.liveSquads ?? {},
  });
  return remote;
}

/**
 * @param {Array<{ name: string, memberIds: string[] }>} squads
 * @param {number} [week]
 */
export function buildFinalizePayload(squads, week = PITCH_PANEL_WEEK) {
  const live = readLivePanelCache();
  /** @type {Record<string, object>} */
  const results = {};

  for (const squad of squads) {
    const liveRow = live?.liveSquads?.[squad.name] ?? {};
    results[squad.name] = resolveSquadPanelResult(
      squad.name,
      squad.memberIds,
      {
        liveAverage: liveRow.panelAverage,
        scoreCount: liveRow.scoreCount,
      },
      week,
    );
  }

  return results;
}

/**
 * @param {Array<{ name: string, memberIds: string[] }>} squads
 * @param {number} [week]
 */
export async function finalizePitchPanelScores(squads, week = PITCH_PANEL_WEEK) {
  const payload = buildFinalizePayload(squads, week);
  writeFinalizedPanelCache(payload);
  try {
    await finalizePitchPanelRemote(payload);
  } catch (err) {
    console.warn('[pitchPanel] cloud finalize failed — local cache saved', err);
  }
  return payload;
}

export function pitchPanelGuestHref() {
  if (typeof window === 'undefined') return '/pitch-panel';
  return `${window.location.origin}/pitch-panel`;
}
