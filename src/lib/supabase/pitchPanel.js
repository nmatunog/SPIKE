import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';
import { PITCH_PANEL_SESSION_ID, sortPitchPanelSquads } from '../staff/pitchPanelConstants.js';

function assertClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Cloud sync is not configured.');
  }
  return supabase;
}

/** @param {string} pin */
export async function fetchPitchPanelSquads(pin) {
  const client = assertClient();
  const { data, error } = await client.rpc('fetch_pitch_panel_squads', { p_pin: pin });
  if (error) throw new Error(error.message);
  return sortPitchPanelSquads(/** @type {string[]} */ (data?.squads ?? []));
}

/**
 * @param {{
 *   pin: string,
 *   panelistToken: string,
 *   panelistName: string,
 *   panelistOrg?: string,
 *   squadName: string,
 *   ratings: { evidence: number, validation: number, presentation: number, team: number },
 *   feedback: { keep: string, improve: string, explore: string },
 * }} input
 */
export async function submitPitchPanelScoreRemote(input) {
  const client = assertClient();
  const { error } = await client.rpc('submit_pitch_panel_score', {
    p_pin: input.pin,
    p_session_id: PITCH_PANEL_SESSION_ID,
    p_panelist_token: input.panelistToken,
    p_panelist_name: input.panelistName,
    p_panelist_org: input.panelistOrg ?? '',
    p_squad_name: input.squadName,
    p_evidence: input.ratings.evidence,
    p_validation: input.ratings.validation,
    p_presentation: input.ratings.presentation,
    p_team: input.ratings.team,
    p_keep_feedback: input.feedback.keep,
    p_improve_feedback: input.feedback.improve,
    p_explore_feedback: input.feedback.explore,
  });
  if (error) throw new Error(error.message);
}

/** @param {string} squadName @param {string} [sessionId] */
export async function fetchPitchPanelSquadFeedbackRemote(squadName, sessionId = PITCH_PANEL_SESSION_ID) {
  const client = assertClient();
  const { data, error } = await client.rpc('fetch_pitch_panel_squad_feedback', {
    p_squad_name: squadName,
    p_session_id: sessionId,
  });
  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? data : [];
  return rows;
}

/** @param {string} [sessionId] */
export async function fetchPitchPanelStateRemote(sessionId = PITCH_PANEL_SESSION_ID) {
  const client = assertClient();
  const { data, error } = await client.rpc('fetch_pitch_panel_state', {
    p_session_id: sessionId,
  });
  if (error) throw new Error(error.message);
  return data ?? null;
}

/**
 * @param {Record<string, { panelAverage: number, week2PanelXp: number, source: string }>} squadResults
 */
export async function finalizePitchPanelRemote(squadResults) {
  const client = assertClient();
  const { error } = await client.rpc('finalize_pitch_panel', {
    p_session_id: PITCH_PANEL_SESSION_ID,
    p_squad_results: squadResults,
  });
  if (error) throw new Error(error.message);
}
