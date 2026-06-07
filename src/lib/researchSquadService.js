/**
 * Research Squad resolution — seeds + Supabase membership (Sprint 05b).
 */
import {
  getResearchSquads,
  getResearchProjectsForSquad,
  getMarketSegmentLabel,
} from './researchSeeds.js';
import {
  fetchResearchSquads,
  fetchSquadMembershipsForUser,
  fetchResearchProjectsForSquad,
} from './supabase/researchSquads.js';

/**
 * @param {string} [squadName] intern_progress.squad text
 * @returns {import('../types/playbook').ResearchSquad | null}
 */
export function resolveSquadFromProgress(squadName) {
  if (!squadName?.trim()) return getResearchSquads()[0] ?? null;
  const squads = getResearchSquads();
  const normalized = squadName.trim().toLowerCase();
  return (
    squads.find((s) => s.name.toLowerCase() === normalized)
    ?? squads.find((s) => s.id.toLowerCase().includes(normalized))
    ?? squads[0]
    ?? null
  );
}

/**
 * @param {string} userId
 * @param {string} [squadName]
 */
export async function getSquadContextForUser(userId, squadName) {
  const memberships = userId ? await fetchSquadMembershipsForUser(userId) : [];
  const membershipSquad = memberships[0]?.squad;

  let squad = null;
  if (membershipSquad) {
    squad = {
      id: membershipSquad.id,
      cohortId: membershipSquad.cohort_id ? String(membershipSquad.cohort_id) : 'cohort-1',
      name: membershipSquad.name,
      marketSegment: membershipSquad.market_segment,
      mentorId: null,
      memberIds: [],
    };
  } else {
    squad = resolveSquadFromProgress(squadName);
  }

  if (!squad) return null;

  const remoteSquads = await fetchResearchSquads();
  const remote = remoteSquads.find((s) => s.id === squad.id);
  if (remote) {
    squad = {
      ...squad,
      name: remote.name,
      marketSegment: remote.market_segment,
      cohortId: remote.cohort_id ? String(remote.cohort_id) : squad.cohortId,
    };
  }

  const remoteProjects = await fetchResearchProjectsForSquad(squad.id);
  const projects =
    remoteProjects.length > 0
      ? remoteProjects.map((p) => ({
          id: p.id,
          squadId: p.squad_id,
          title: p.title,
          hypothesis: p.hypothesis ?? '',
          status: p.status,
        }))
      : getResearchProjectsForSquad(squad.id);

  const context = {
    squad,
    projects,
    marketSegmentLabel: getMarketSegmentLabel(squad.marketSegment),
    membershipCount: memberships.length || 1,
  };

  cacheSquadForUser(userId, squad.id, squad.marketSegment);
  return context;
}

const CACHE_PREFIX = 'spike_user_squad_';

/** @param {string} userId @param {string} squadId @param {string} marketSegment */
export function cacheSquadForUser(userId, squadId, marketSegment) {
  if (!userId || !squadId) return;
  localStorage.setItem(
    `${CACHE_PREFIX}${userId}`,
    JSON.stringify({ id: squadId, marketSegment }),
  );
}

/** @param {string} userId */
export function getCachedSquadForUser(userId) {
  if (!userId) return null;
  try {
    return JSON.parse(localStorage.getItem(`${CACHE_PREFIX}${userId}`) || 'null');
  } catch {
    return null;
  }
}

/**
 * @param {string} userId
 * @param {string} [squadName]
 */
export function resolveSquadIdForUser(userId, squadName) {
  const cached = getCachedSquadForUser(userId);
  if (cached?.id) return cached;
  const squad = resolveSquadFromProgress(squadName);
  if (squad) {
    cacheSquadForUser(userId, squad.id, squad.marketSegment);
    return { id: squad.id, marketSegment: squad.marketSegment };
  }
  return null;
}
