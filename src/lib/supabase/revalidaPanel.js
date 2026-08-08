import { supabase } from '../../supabaseClient.js';
import { RA_SPIKE_REVALIDA_ACCESS_PIN } from '../raSpikeRevalidaConstants.js';

function client() {
  if (!supabase) throw new Error('Cloud sync is not configured.');
  return supabase;
}

/** @param {string} pin */
export async function fetchRevalidaCohortsRemote(pin = RA_SPIKE_REVALIDA_ACCESS_PIN) {
  const { data, error } = await client().rpc('fetch_revalida_cohorts', { p_pin: pin });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/** @param {number | string} cohortId @param {string} [pin] */
export async function fetchRevalidaGuestRatingsRemote(cohortId, panelistToken, pin = RA_SPIKE_REVALIDA_ACCESS_PIN) {
  const { data, error } = await client().rpc('fetch_revalida_guest_ratings', {
    p_pin: pin,
    p_panelist_token: panelistToken,
    p_cohort_id: parseInt(String(cohortId), 10),
  });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/** @param {number | string} cohortId */
export async function fetchRevalidaPanelistRatingsRemote(cohortId) {
  const { data, error } = await client().rpc('fetch_revalida_panelist_ratings', {
    p_cohort_id: parseInt(String(cohortId), 10),
  });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/** @param {number | string} cohortId @param {string} [pin] */
export async function fetchRevalidaSquadsRemote(cohortId, pin = RA_SPIKE_REVALIDA_ACCESS_PIN) {
  const { data, error } = await client().rpc('fetch_revalida_squads', {
    p_pin: pin,
    p_cohort_id: parseInt(String(cohortId), 10),
  });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/** @param {string} squadId @param {string} [pin] */
export async function fetchRevalidaSquadMembersRemote(squadId, pin = RA_SPIKE_REVALIDA_ACCESS_PIN) {
  const { data, error } = await client().rpc('fetch_revalida_squad_members', {
    p_pin: pin,
    p_squad_id: squadId,
  });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

/**
 * @param {object} input
 * @param {string} input.panelistToken
 * @param {string} input.name
 * @param {string} [input.org]
 * @param {number | string | null} [input.cohortId]
 * @param {string} [input.pin]
 */
export async function revalidaPanelistCheckInRemote(input) {
  const { data, error } = await client().rpc('revalida_panelist_check_in', {
    p_pin: input.pin ?? RA_SPIKE_REVALIDA_ACCESS_PIN,
    p_panelist_token: input.panelistToken,
    p_panelist_name: input.name,
    p_panelist_org: input.org ?? '',
    p_cohort_id: input.cohortId != null ? parseInt(String(input.cohortId), 10) : null,
  });
  if (error) throw error;
  return data;
}

/** @param {string} panelistToken @param {string} squadId @param {string} [pin] */
export async function fetchRevalidaGuestRatingRemote(panelistToken, squadId, pin = RA_SPIKE_REVALIDA_ACCESS_PIN) {
  const { data, error } = await client().rpc('fetch_revalida_guest_rating', {
    p_pin: pin,
    p_panelist_token: panelistToken,
    p_squad_id: squadId,
  });
  if (error) throw error;
  return data ?? null;
}

/** @param {object} payload */
export async function submitRevalidaGuestRatingRemote(payload) {
  const { data, error } = await client().rpc('submit_revalida_guest_rating', {
    p_pin: payload.pin ?? RA_SPIKE_REVALIDA_ACCESS_PIN,
    p_panelist_token: payload.panelistToken,
    p_panelist_name: payload.panelistName,
    p_panelist_org: payload.panelistOrg ?? '',
    p_cohort_id: parseInt(String(payload.cohortId), 10),
    p_squad_id: payload.squadId,
    p_fvp_score: payload.fvpScore,
    p_business_model_score: payload.businessModelScore,
    p_strategy_score: payload.strategyScore,
    p_presentation_score: payload.presentationScore,
    p_investment_score: payload.investmentScore,
    p_greatest_strength: payload.greatestStrength,
    p_improvement: payload.improvement,
    p_recommendation: payload.recommendation,
    p_standout_participant_id: payload.standoutParticipantId || null,
  });
  if (error) throw error;
  return data;
}

/** @param {object} payload */
export async function finalizeRevalidaGuestRatingsRemote(payload) {
  const { data, error } = await client().rpc('finalize_revalida_guest_ratings', {
    p_pin: payload.pin ?? RA_SPIKE_REVALIDA_ACCESS_PIN,
    p_panelist_token: payload.panelistToken,
    p_cohort_id: parseInt(String(payload.cohortId), 10),
  });
  if (error) throw error;
  return data;
}

/** @param {number | string} cohortId */
export async function finalizeRevalidaPanelistRatingsRemote(cohortId) {
  const { data, error } = await client().rpc('finalize_revalida_panelist_ratings', {
    p_cohort_id: parseInt(String(cohortId), 10),
  });
  if (error) throw error;
  return data;
}
