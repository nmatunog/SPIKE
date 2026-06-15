/**
 * Cohort onboarding — business logic and step resolution (Supabase-backed).
 */
import { apiUrl } from '../apiClient.js';
import { isSupabaseConfigured } from '../supabaseClient.js';
import { getStoredMockUser, isMockUserId, readPersistedMockUser, updateMockInternProgress } from './mockAuth.js';
import { setSectionField } from './blueprintSectionStore.js';
import {
  COHORT_NAME_EXAMPLES,
  SQUAD_MOTTO_EXAMPLES,
  SQUAD_NAME_EXAMPLES,
} from './cohortFormationStorage.js';
import * as db from './supabase/cohortOnboarding.js';

export { COHORT_NAME_EXAMPLES, SQUAD_NAME_EXAMPLES, SQUAD_MOTTO_EXAMPLES };

/** @type {Map<string, boolean>} */
const completeCache = new Map();

const WELCOMED_SESSION_KEY = 'spike_onboarding_welcomed_v1';

/** @param {string} participantId */
function readWelcomedSessionCache(participantId) {
  try {
    const map = JSON.parse(sessionStorage.getItem(WELCOMED_SESSION_KEY) || '{}');
    return typeof map[participantId] === 'string' ? map[participantId] : null;
  } catch {
    return null;
  }
}

/** @param {string} participantId @param {string} welcomedAt */
function writeWelcomedSessionCache(participantId, welcomedAt) {
  try {
    const map = JSON.parse(sessionStorage.getItem(WELCOMED_SESSION_KEY) || '{}');
    map[participantId] = welcomedAt;
    sessionStorage.setItem(WELCOMED_SESSION_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * @param {string} participantId
 * @param {{ onboarding_complete?: boolean, onboarding_welcomed_at?: string | null, cohort_id?: string | null } | null} progress
 */
function mergeWelcomedProgress(participantId, progress) {
  const base = progress ?? {
    onboarding_complete: false,
    onboarding_welcomed_at: null,
    cohort_id: null,
  };
  if (base.onboarding_welcomed_at) return base;
  const cached = readWelcomedSessionCache(participantId);
  if (!cached) return base;
  return { ...base, onboarding_welcomed_at: cached };
}

/**
 * @typedef {'welcome' | 'suggest' | 'waiting' | 'vote' | 'reveal' | 'cohort-photo' | 'squad-wait' | 'squad-name' | 'squad-motto' | 'squad-register' | 'squad-photo' | 'complete'} OnboardingStep
 */

/** @param {string} participantId */
export function setOnboardingCompleteCache(participantId, value) {
  completeCache.set(participantId, value);
}

/** @param {string} participantId */
export function hasCompletedOnboardingSync(participantId) {
  return Boolean(completeCache.get(participantId));
}

/** @param {string} participantId */
function readMockOnboardingProgress(participantId) {
  if (!isMockUserId(participantId)) return null;

  const stored = readPersistedMockUser();
  const source =
    stored?.id === participantId
      ? stored
      : (() => {
          const fromTemplate = getStoredMockUser();
          return fromTemplate?.id === participantId ? fromTemplate : null;
        })();

  if (!source) return null;
  return {
    onboarding_complete: Boolean(source.internProgress?.onboarding_complete),
    onboarding_welcomed_at: source.internProgress?.onboarding_welcomed_at ?? null,
    cohort_id: null,
  };
}

/** @param {string} participantId */
export async function hydrateOnboardingStatus(participantId) {
  if (!isSupabaseConfigured) return false;
  if (isMockUserId(participantId)) {
    const progress = readMockOnboardingProgress(participantId);
    const done = Boolean(progress?.onboarding_complete);
    completeCache.set(participantId, done);
    return done;
  }
  try {
    const progress = await db.fetchParticipantOnboarding(participantId);
    const done = Boolean(progress?.onboarding_complete);
    completeCache.set(participantId, done);
    return done;
  } catch {
    return false;
  }
}

/** @param {string} participantId */
export function hasSubmittedCohortIdentity(participantId) {
  return hasCompletedOnboardingSync(participantId);
}

/**
 * @param {{
 *   cohort: import('./supabase/cohortOnboarding.js').CohortRow | null,
 *   progress: { onboarding_complete?: boolean, onboarding_welcomed_at?: string | null } | null,
 *   suggestion: { suggested_name: string } | null,
 *   vote: { finalist_id: string } | null,
 *   squad: { squad: { name?: string, motto?: string, photo_url?: string | null, registered_at?: string | null, onboarding_complete?: boolean } | null } | null,
 * }} ctx
 * @returns {OnboardingStep}
 */
export function resolveOnboardingStep(ctx) {
  const { cohort, progress, suggestion, vote, squad } = ctx;
  if (progress?.onboarding_complete) return 'complete';
  if (!progress?.onboarding_welcomed_at) return 'welcome';

  const phase = cohort?.onboarding_phase ?? 'suggestions_closed';

  if (phase === 'suggestions_open') {
    return suggestion?.suggested_name ? 'waiting' : 'suggest';
  }

  if (phase === 'suggestions_closed') {
    return suggestion?.suggested_name ? 'waiting' : 'waiting';
  }

  if (phase === 'finalists_ready') {
    return 'waiting';
  }

  if (phase === 'voting_open') {
    return vote ? 'waiting' : 'vote';
  }

  if (phase === 'voting_closed') {
    return 'waiting';
  }

  if (phase === 'winner_revealed') {
    return 'reveal';
  }

  if (phase === 'cohort_photo_complete') {
    if (!squad?.squad) return 'squad-wait';
    const s = squad.squad;
    if (!s.name?.trim()) return 'squad-name';
    if (!s.motto?.trim()) return 'squad-motto';
    if (!s.registered_at) return 'squad-register';
    if (!s.photo_url) return 'squad-photo';
    return 'complete';
  }

  if (phase === 'squads_assigned' || phase === 'onboarding_complete') {
    if (!squad?.squad) return 'squad-wait';
    const s = squad.squad;
    if (!s.name?.trim()) return 'squad-name';
    if (!s.motto?.trim()) return 'squad-motto';
    if (!s.registered_at) return 'squad-register';
    if (!s.photo_url) return 'squad-photo';
    return 'complete';
  }

  return suggestion?.suggested_name ? 'waiting' : 'waiting';
}

/** @param {string} participantId */
export async function loadOnboardingContext(participantId) {
  if (isMockUserId(participantId)) {
    const progress = mergeWelcomedProgress(
      participantId,
      readMockOnboardingProgress(participantId) ?? {
        onboarding_complete: false,
        onboarding_welcomed_at: null,
        cohort_id: null,
      },
    );
    const cohort = await db.fetchActiveCohort().catch(() => null);
    const step = resolveOnboardingStep({
      cohort,
      progress,
      suggestion: null,
      vote: null,
      squad: null,
    });
    if (progress.onboarding_complete) {
      completeCache.set(participantId, true);
    }
    return {
      cohort,
      progress,
      suggestion: null,
      vote: null,
      squad: null,
      finalists: [],
      tally: [],
      step,
    };
  }

  const cohort = await db.fetchActiveCohort().catch(() => null);
  const progressRaw = await db.fetchParticipantOnboarding(participantId).catch(() => ({
    onboarding_complete: false,
    onboarding_welcomed_at: null,
    cohort_id: null,
  }));
  const progress = mergeWelcomedProgress(participantId, progressRaw);

  if (!cohort) {
    const step = resolveOnboardingStep({
      cohort: null,
      progress,
      suggestion: null,
      vote: null,
      squad: null,
    });
    return {
      cohort: null,
      progress,
      suggestion: null,
      vote: null,
      squad: null,
      finalists: [],
      tally: [],
      step,
    };
  }

  const [suggestion, vote, squad, finalists, tally] = await Promise.all([
    db.fetchParticipantSuggestion(cohort.id, participantId).catch(() => null),
    db.fetchParticipantVote(cohort.id, participantId).catch(() => null),
    db.fetchParticipantSquad(participantId).catch(() => null),
    db.fetchFinalists(cohort.id).catch(() => []),
    db.computeVoteTally(cohort.id).catch(() => []),
  ]);

  const step = resolveOnboardingStep({ cohort, progress, suggestion, vote, squad });

  if (progress?.onboarding_complete) {
    completeCache.set(participantId, true);
  }

  return { cohort, progress, suggestion, vote, squad, finalists, tally, step };
}

/** @param {string} participantId */
export function hasAcknowledgedWelcome(participantId) {
  return Boolean(readWelcomedSessionCache(participantId));
}

/** @param {string} participantId */
export async function completeWelcome(participantId) {
  const welcomedAt = new Date().toISOString();

  if (isMockUserId(participantId)) {
    const updated = updateMockInternProgress(participantId, {
      onboarding_welcomed_at: welcomedAt,
    });
    if (!updated) {
      throw new Error(
        'Could not save welcome progress. Sign out and sign in again with your SPIKE account.',
      );
    }
    writeWelcomedSessionCache(participantId, welcomedAt);
    return;
  }

  const row = await db.markParticipantWelcomed(participantId);
  writeWelcomedSessionCache(participantId, row.onboarding_welcomed_at ?? welcomedAt);
}

/**
 * @param {string} participantId
 * @param {{ name: string, reason?: string }} input
 */
export async function submitCohortSuggestion(participantId, input) {
  const cohort = await db.fetchActiveCohort();
  if (!cohort) throw new Error('No active cohort.');
  if (cohort.onboarding_phase !== 'suggestions_open') {
    throw new Error('Suggestions are not open.');
  }
  const row = await db.upsertSuggestion(cohort.id, participantId, input);
  syncCohortSuggestionToBlueprint(participantId, row);
  return row;
}

/** @param {string} participantId @param {Record<string, unknown>} row */
function syncCohortSuggestionToBlueprint(participantId, row) {
  const block = [
    `Cohort Name Suggestion: ${row.suggested_name}`,
    row.reason ? `Reason: ${row.reason}` : '',
  ].filter(Boolean).join('\n');
  setSectionField(participantId, 'vision-purpose', 'cohort_identity', block, {
    sourceType: 'cohort_identity',
    sourceId: String(row.id),
  });
}

/** @param {string} participantId @param {string} finalistId */
export async function submitCohortVote(participantId, finalistId) {
  const cohort = await db.fetchActiveCohort();
  if (!cohort) throw new Error('No active cohort.');
  if (cohort.onboarding_phase !== 'voting_open') {
    throw new Error('Voting is not open.');
  }
  return db.castVote(cohort.id, participantId, finalistId);
}

/** @param {string} squadId @param {{ name?: string, motto?: string }} patch */
export async function updateSquadSetup(squadId, patch) {
  return db.updateFormationSquad(squadId, patch);
}

/** @param {string} squadId */
export async function registerSquad(squadId) {
  const squad = await db.updateFormationSquad(squadId, {
    registered_at: new Date().toISOString(),
    status: 'active',
  });
  await db.syncFormationSquadMemberLabels(squadId);
  return squad;
}

/** @param {string} squadId @param {string} photoUrl */
export async function uploadSquadPhoto(squadId, photoUrl) {
  const squad = await db.updateFormationSquad(squadId, {
    photo_url: photoUrl,
    onboarding_complete: true,
  });
  return squad;
}

/** @param {string} participantId @param {string} squadId */
export async function finishOnboarding(participantId, squadId) {
  if (isMockUserId(participantId)) {
    updateMockInternProgress(participantId, { onboarding_complete: true });
    completeCache.set(participantId, true);
    return;
  }
  await db.updateFormationSquad(squadId, { onboarding_complete: true });
  try {
    await db.markOnboardingComplete(participantId);
  } catch (err) {
    console.warn('[onboarding] markOnboardingComplete failed:', err);
  }
  await db.syncFormationSquadMemberLabels(squadId);
  completeCache.set(participantId, true);
}

/** @param {Array<{ suggested_name: string, reason?: string }>} suggestions */
export async function requestAiFinalists(suggestions) {
  try {
    const res = await fetch(apiUrl('/api/onboarding/generate-finalists'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestions }),
    });
    const raw = await res.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      return { finalists: [], unavailable: true };
    }
    if (!res.ok) return { finalists: [], unavailable: true, reason: data?.reason };
    return { finalists: data?.finalists ?? [], provider: data?.provider };
  } catch {
    return { finalists: [], unavailable: true };
  }
}

/** Staff actions */
export async function staffOpenSuggestions(cohortId) {
  return db.setCohortPhase(cohortId, 'suggestions_open');
}

export async function staffCloseSuggestions(cohortId) {
  return db.setCohortPhase(cohortId, 'suggestions_closed');
}

export async function staffPublishVoting(cohortId) {
  return db.setCohortPhase(cohortId, 'voting_open');
}

export async function staffCloseVoting(cohortId) {
  return db.setCohortPhase(cohortId, 'voting_closed');
}

export async function staffRevealWinner(cohortId) {
  return db.revealWinner(cohortId);
}

/**
 * @param {number} cohortId
 * @param {Array<{ name: string, mergedFrom?: string[] }>} finalists
 * @param {string} [staffId]
 */
export async function staffSaveFinalists(cohortId, finalists, staffId) {
  await db.replaceFinalists(cohortId, finalists, staffId);
  return db.setCohortPhase(cohortId, 'finalists_ready');
}

/** @param {number} cohortId @param {string} photoUrl */
export async function staffUploadCohortPhoto(cohortId, photoUrl) {
  return db.setCohortPhoto(cohortId, photoUrl);
}

/** @param {number} cohortId */
export async function staffMarkSquadsAssigned(cohortId) {
  return db.setCohortPhase(cohortId, 'squads_assigned');
}

/** @param {string} squadId @param {string} participantId */
export async function staffAddInternToSquad(squadId, participantId) {
  return db.addSquadMember(squadId, participantId);
}

/** @param {string} squadId @param {string} participantId */
export async function staffRemoveInternFromSquad(squadId, participantId) {
  return db.removeSquadMember(squadId, participantId);
}

/** @param {string} squadId */
export async function staffDeleteFormationSquad(squadId) {
  return db.deleteFormationSquad(squadId);
}

export async function staffEnsureActiveCohort() {
  return db.ensureActiveCohortForStaff();
}

export async function staffLoadDashboard() {
  let cohort = await db.fetchActiveCohort();
  if (!cohort) {
    try {
      cohort = await db.ensureActiveCohortForStaff();
    } catch {
      cohort = null;
    }
  }
  if (!cohort) return null;
  const [suggestions, finalists, tally, squads] = await Promise.all([
    db.fetchSuggestions(cohort.id),
    db.fetchFinalists(cohort.id),
    db.computeVoteTally(cohort.id),
    db.fetchFormationSquads(cohort.id),
  ]);
  return { cohort, suggestions, finalists, tally, squads };
}

export async function staffGenerateAndSaveFinalists(cohortId, staffId) {
  const suggestions = await db.fetchSuggestions(cohortId);
  const ai = await requestAiFinalists(suggestions);
  let finalists = ai.finalists;
  if (!finalists.length) {
    finalists = dedupeSuggestions(suggestions);
  }
  await db.replaceFinalists(cohortId, finalists, staffId);
  await db.updateCohort(cohortId, {
    onboarding_phase: 'finalists_ready',
    finalists_generated_at: new Date().toISOString(),
    finalists_generated_by: staffId,
  });
  return finalists;
}

/** @param {Array<{ suggested_name: string }>} suggestions */
function dedupeSuggestions(suggestions) {
  const seen = new Set();
  const out = [];
  for (const s of suggestions) {
    const name = String(s.suggested_name ?? '').trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push({ name, mergedFrom: [name] });
    if (out.length >= 5) break;
  }
  return out;
}

export {
  db,
};
