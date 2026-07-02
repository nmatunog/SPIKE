/**
 * Week 2 pitch panel — VC investment aggregation, finalize, XP mapping.
 */
import {
  buildInvestmentLeaderboard,
  detectInvestmentTie,
  investmentRankToWeek2Xp,
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

/** @deprecated Use investmentRankToWeek2Xp */
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
    leaderboard: buildInvestmentLeaderboard(
      Object.entries(squads).map(([squadName, row]) => ({
        squadName,
        finalInvestment: row.totalInvestment ?? 0,
      })),
    ),
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
 * @param {number} rank
 * @param {string[]} memberIds
 * @param {{ totalInvestment?: number, finalInvestment?: number, investorCount?: number }} [live]
 * @param {number} [week]
 */
export function resolveSquadPanelResult(squadName, memberIds, live = {}, week = PITCH_PANEL_WEEK, rank = 0) {
  const pitched = squadSubmittedWeek2Pitch(memberIds);
  const finalInvestment = Number(live.finalInvestment ?? live.totalInvestment ?? 0);
  const hasInvestment = finalInvestment > 0 && (live.finalizedInvestorCount ?? 0) > 0;

  if (hasInvestment && rank > 0) {
    return {
      squadName,
      totalInvestment: finalInvestment,
      panelAverage: null,
      week2PanelXp: investmentRankToWeek2Xp(rank),
      source: 'panel',
      panelistCount: live.finalizedInvestorCount ?? live.investorCount ?? 0,
      rank,
    };
  }

  if (pitched) {
    const panelAverage = computeMentorProxyPanelAverage(squadName, memberIds, week);
    return {
      squadName,
      totalInvestment: 0,
      panelAverage: Math.round(panelAverage * 10) / 10,
      week2PanelXp: panelAverageToWeek2Xp(panelAverage),
      source: 'mentor_proxy',
      panelistCount: 0,
      rank: null,
    };
  }

  return {
    squadName,
    totalInvestment: 0,
    panelAverage: null,
    week2PanelXp: 0,
    source: 'none',
    panelistCount: 0,
    rank: null,
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
      totalInvestment: finalRow.totalInvestment ?? 0,
      panelAverage: finalRow.panelAverage ?? null,
      week2PanelXp: finalRow.week2PanelXp ?? 0,
      provisionalWeek2PanelXp: null,
      finalized: true,
      pending: false,
      source: finalRow.source ?? 'panel',
      panelistCount: finalRow.panelistCount ?? 0,
      rank: finalRow.rank ?? null,
    };
  }

  const live = readLivePanelCache();
  const liveRow = live?.liveSquads?.[squadName] ?? {};
  const provisionalInvestment = Number(liveRow.provisionalInvestment ?? liveRow.totalInvestment ?? 0);

  return {
    squadName,
    totalInvestment: provisionalInvestment,
    panelAverage: null,
    week2PanelXp: 0,
    provisionalWeek2PanelXp: null,
    finalized: false,
    pending: provisionalInvestment > 0,
    source: 'live',
    panelistCount: liveRow.investorCount ?? 0,
    rank: null,
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
    panelists: remote.panelists ?? [],
    tieVotes: remote.tieVotes ?? {},
  });
  return remote;
}

/**
 * @param {Array<{ name: string, memberIds: string[] }>} squads
 * @param {number} [week]
 */
export function buildFinalizePayload(squads, week = PITCH_PANEL_WEEK) {
  const live = readLivePanelCache();
  const liveSquads = live?.liveSquads ?? {};

  const leaderboard = buildInvestmentLeaderboard(
    squads.map((s) => ({
      squadName: s.name,
      finalInvestment: liveSquads[s.name]?.finalInvestment ?? 0,
    })),
  );

  const tieSquads = detectInvestmentTie(leaderboard);
  const tieVotes = live?.tieVotes ?? {};
  let winnerOverride = null;
  if (tieSquads?.length) {
    const voteCounts = tieSquads.map((name) => ({
      squadName: name,
      votes: Number(tieVotes[name.toLowerCase()] ?? tieVotes[name] ?? 0),
    }));
    voteCounts.sort((a, b) => b.votes - a.votes);
    if (voteCounts[0]?.votes > 0) {
      winnerOverride = voteCounts[0].squadName;
    }
  }

  if (winnerOverride && leaderboard.length >= 2 && leaderboard[0].totalInvestment === leaderboard[1].totalInvestment) {
    const winnerIdx = leaderboard.findIndex((r) => r.squadName === winnerOverride);
    if (winnerIdx > 0) {
      const [winner] = leaderboard.splice(winnerIdx, 1);
      leaderboard.unshift(winner);
    }
  }

  const rankMap = new Map(leaderboard.map((row, idx) => [row.squadName, idx + 1]));

  /** @type {Record<string, object>} */
  const results = {};
  for (const squad of squads) {
    const liveRow = liveSquads[squad.name] ?? {};
    const rank = rankMap.get(squad.name) ?? squads.length;
    results[squad.name] = resolveSquadPanelResult(
      squad.name,
      squad.memberIds,
      {
        totalInvestment: liveRow.totalInvestment,
        finalInvestment: liveRow.finalInvestment,
        investorCount: liveRow.investorCount,
        finalizedInvestorCount: liveRow.finalizedInvestorCount,
      },
      week,
      rank,
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

/**
 * Export finalized results as CSV text.
 * @param {Array<{ name: string }>} squads
 */
export function exportPitchPanelResultsCsv(squads) {
  const finalized = readFinalizedPanelCache();
  const rows = [['Squad', 'Total Investment', 'Rank', 'Week 2 XP', 'Investors', 'Source']];
  const leaderboard = buildInvestmentLeaderboard(
    squads.map((s) => ({
      squadName: s.name,
      finalInvestment: finalized?.squads?.[s.name]?.totalInvestment ?? 0,
    })),
  );
  const rankMap = new Map(leaderboard.map((r, i) => [r.squadName, i + 1]));

  for (const squad of squads) {
    const row = finalized?.squads?.[squad.name] ?? {};
    rows.push([
      squad.name,
      String(row.totalInvestment ?? 0),
      String(rankMap.get(squad.name) ?? ''),
      String(row.week2PanelXp ?? 0),
      String(row.panelistCount ?? 0),
      String(row.source ?? ''),
    ]);
  }

  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}
