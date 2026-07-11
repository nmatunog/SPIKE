import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { isMockUserId } from './mockAuth.js';
import { fetchFormationSquads, fetchSuggestions } from './supabase/cohortOnboarding.js';
import { PROGRAM_SLUGS } from './programs/constants.js';
import { RA_SPIKE_PROGRAM } from './programs/ra-spike.js';

const SQUAD_CAPACITY = RA_SPIKE_PROGRAM.squadMaxMembers;

const MOCK_KEY = 'ra_spike_self_squad_v1';

/**
 * @typedef {{
 *   cohortId: number | null,
 *   cohortLabel: string,
 *   squadId: string | null,
 *   squadName: string | null,
 *   role: string | null,
 *   isLeader: boolean,
 *   memberCount: number,
 *   squadCapacity: number,
 *   openSquads: Array<{ id: string, name: string, memberCount: number, capacity: number, open: boolean }>,
 *   cohortSuggestion: string | null,
 *   peerSuggestions: Array<{ name: string, count: number }>,
 * }} RaSpikeSquadSelfState
 */

/** @param {string} participantId */
function mockKey(participantId) {
  return `${MOCK_KEY}:${participantId}`;
}

/** @param {string} participantId */
function readMockState(participantId) {
  try {
    const raw = localStorage.getItem(mockKey(participantId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** @param {string} participantId @param {object} state */
function writeMockState(participantId, state) {
  try {
    localStorage.setItem(mockKey(participantId), JSON.stringify(state));
  } catch {
    /* quota */
  }
}

/**
 * @param {string} participantId
 * @param {object | null | undefined} internProgress
 * @returns {Promise<RaSpikeSquadSelfState>}
 */
export async function fetchRaSpikeSquadSelfState(participantId, internProgress) {
  const empty = {
    cohortId: null,
    cohortLabel: '',
    squadId: null,
    squadName: null,
    role: null,
    isLeader: false,
    memberCount: 0,
    squadCapacity: SQUAD_CAPACITY,
    openSquads: [],
    cohortSuggestion: null,
    peerSuggestions: [],
  };

  if (!participantId) return empty;

  if (isMockUserId(participantId) || !isSupabaseConfigured || !supabase) {
    const mock = readMockState(participantId);
    if (!mock) return { ...empty, cohortLabel: 'RA-SPIKE sample cohort' };
    const openSquads = (mock.openSquads ?? []).map((s) => ({
      ...s,
      open: s.id === mock.squadId ? false : s.memberCount < (s.capacity ?? SQUAD_CAPACITY),
    }));
    return {
      cohortId: mock.cohortId ?? 1,
      cohortLabel: mock.cohortLabel || 'RA-SPIKE sample cohort',
      squadId: mock.squadId ?? null,
      squadName: mock.squadName ?? null,
      role: mock.role ?? null,
      isLeader: Boolean(mock.isLeader),
      memberCount: mock.memberCount ?? (mock.squadId ? 1 : 0),
      squadCapacity: mock.squadCapacity ?? SQUAD_CAPACITY,
      openSquads,
      cohortSuggestion: mock.cohortSuggestion ?? null,
      peerSuggestions: mock.peerSuggestions ?? [],
    };
  }

  let cohortId = internProgress?.cohort_id ?? null;
  let cohortLabel = '';

  if (!cohortId) {
    const { data: active } = await supabase
      .from('cohorts')
      .select('id, name, batch_label, official_name')
      .eq('program_slug', PROGRAM_SLUGS.RA_SPIKE)
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    cohortId = active?.id ?? null;
    cohortLabel = active?.official_name || active?.batch_label || active?.name || '';
  } else {
    const { data: cohort } = await supabase
      .from('cohorts')
      .select('id, name, batch_label, official_name')
      .eq('id', cohortId)
      .maybeSingle();
    cohortLabel = cohort?.official_name || cohort?.batch_label || cohort?.name || '';
  }

  if (!cohortId) return empty;

  const squads = await fetchFormationSquads(cohortId).catch(() => []);
  /** @type {RaSpikeSquadSelfState['openSquads']} */
  const openSquads = [];
  let mine = null;

  for (const squad of squads) {
    const members = squad.formation_squad_members ?? [];
    const capacity = squad.capacity ?? SQUAD_CAPACITY;
    const memberCount = members.length;
    const membership = members.find((m) => m.participant_id === participantId);
    if (membership) {
      mine = {
        squadId: squad.id,
        squadName: squad.name ?? null,
        role: membership.role ?? 'Member',
        isLeader: membership.role === 'Leader',
        memberCount,
        squadCapacity: capacity,
      };
    }
    openSquads.push({
      id: squad.id,
      name: squad.name || 'Unnamed squad',
      memberCount,
      capacity,
      open: !membership && memberCount < capacity,
    });
  }

  const suggestions = await fetchSuggestions(cohortId).catch(() => []);
  const mineSuggestion = suggestions.find((s) => s.participant_id === participantId);
  /** @type {Map<string, number>} */
  const peerMap = new Map();
  for (const s of suggestions) {
    const name = String(s.suggested_name ?? '').trim();
    if (!name) continue;
    peerMap.set(name, (peerMap.get(name) ?? 0) + 1);
  }

  return {
    cohortId,
    cohortLabel,
    squadId: mine?.squadId ?? null,
    squadName: mine?.squadName ?? null,
    role: mine?.role ?? null,
    isLeader: Boolean(mine?.isLeader),
    memberCount: mine?.memberCount ?? 0,
    squadCapacity: mine?.squadCapacity ?? SQUAD_CAPACITY,
    openSquads: openSquads.filter((s) => s.open || s.id === mine?.squadId),
    cohortSuggestion: mineSuggestion?.suggested_name ?? null,
    peerSuggestions: [...peerMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/** @param {string} participantId @param {string} name */
export async function raSpikeCreateSquad(participantId, name) {
  const trimmed = name.trim();
  if (trimmed.length < 2) throw new Error('Squad name must be at least 2 characters.');

  if (isMockUserId(participantId) || !isSupabaseConfigured || !supabase) {
    const id = `mock-squad-${Date.now()}`;
    const state = {
      cohortId: 1,
      cohortLabel: 'RA-SPIKE sample cohort',
      squadId: id,
      squadName: trimmed,
      role: 'Leader',
      isLeader: true,
      memberCount: 1,
      openSquads: [{ id, name: trimmed, memberCount: 1, capacity: SQUAD_CAPACITY, open: false }],
      cohortSuggestion: readMockState(participantId)?.cohortSuggestion ?? null,
      peerSuggestions: readMockState(participantId)?.peerSuggestions ?? [],
    };
    writeMockState(participantId, state);
    return state;
  }

  const { data, error } = await supabase.rpc('ra_spike_create_squad', { p_name: trimmed });
  if (error) throw new Error(error.message);
  return data;
}

/** @param {string} participantId @param {string} squadId */
export async function raSpikeJoinSquad(participantId, squadId) {
  if (isMockUserId(participantId) || !isSupabaseConfigured || !supabase) {
    const state = readMockState(participantId) ?? {};
    const open = (state.openSquads ?? []).find((s) => s.id === squadId);
    if (!open) throw new Error('Squad not found.');
    if (open.memberCount >= (open.capacity ?? SQUAD_CAPACITY)) throw new Error('This squad is full.');
    const next = {
      ...state,
      squadId,
      squadName: open.name,
      role: 'Member',
      isLeader: false,
      memberCount: open.memberCount + 1,
    };
    writeMockState(participantId, next);
    return next;
  }

  const { data, error } = await supabase.rpc('ra_spike_join_squad', { p_squad_id: squadId });
  if (error) throw new Error(error.message);
  return data;
}

/** @param {string} participantId @param {string} squadId @param {string} name */
export async function raSpikeRenameSquad(participantId, squadId, name) {
  const trimmed = name.trim();
  if (trimmed.length < 2) throw new Error('Squad name must be at least 2 characters.');

  if (isMockUserId(participantId) || !isSupabaseConfigured || !supabase) {
    const state = readMockState(participantId);
    if (!state?.isLeader || state.squadId !== squadId) {
      throw new Error('Only the squad leader can rename the squad.');
    }
    const next = { ...state, squadName: trimmed };
    writeMockState(participantId, next);
    return next;
  }

  const { data, error } = await supabase.rpc('ra_spike_rename_squad', {
    p_squad_id: squadId,
    p_name: trimmed,
  });
  if (error) throw new Error(error.message);
  return data;
}

/** @param {string} participantId */
export async function raSpikeLeaveSquad(participantId) {
  if (isMockUserId(participantId) || !isSupabaseConfigured || !supabase) {
    const state = readMockState(participantId) ?? {};
    writeMockState(participantId, {
      ...state,
      squadId: null,
      squadName: null,
      role: null,
      isLeader: false,
      memberCount: 0,
    });
    return;
  }

  const { error } = await supabase.rpc('ra_spike_leave_squad');
  if (error) throw new Error(error.message);
}

/** @param {string} participantId @param {string} name @param {string} [reason] */
export async function raSpikeNominateCohortName(participantId, name, reason = '') {
  const trimmed = name.trim();
  if (trimmed.length < 2) throw new Error('Cohort name must be at least 2 characters.');

  if (isMockUserId(participantId) || !isSupabaseConfigured || !supabase) {
    const state = readMockState(participantId) ?? {
      cohortId: 1,
      cohortLabel: 'RA-SPIKE sample cohort',
    };
    const peers = [...(state.peerSuggestions ?? [])];
    const existing = peers.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) existing.count += 1;
    else peers.push({ name: trimmed, count: 1 });
    const next = { ...state, cohortSuggestion: trimmed, peerSuggestions: peers };
    writeMockState(participantId, next);
    return next;
  }

  const { data, error } = await supabase.rpc('ra_spike_nominate_cohort_name', {
    p_name: trimmed,
    p_reason: reason,
  });
  if (error) throw new Error(error.message);
  return data;
}

/** Squad + cohort nomination complete for Learn card. */
export function isRaSpikeSquadSelfComplete(state) {
  return Boolean(state?.squadId && state?.squadName && state?.cohortSuggestion);
}
