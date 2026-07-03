import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';
import {
  PITCH_PANEL_SESSION_ID,
  sortPitchPanelSquads,
} from '../staff/pitchPanelConstants.js';

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
 *   amount: number,
 *   comment?: string,
 * }} input
 */
export async function submitPitchPanelInvestmentRemote(input) {
  const client = assertClient();
  const { error } = await client.rpc('submit_pitch_panel_investment', {
    p_pin: input.pin,
    p_session_id: PITCH_PANEL_SESSION_ID,
    p_panelist_token: input.panelistToken,
    p_panelist_name: input.panelistName,
    p_panelist_org: input.panelistOrg ?? '',
    p_squad_name: input.squadName,
    p_amount: input.amount,
    p_comment: input.comment ?? '',
  });
  if (error) throw new Error(error.message);
}

/**
 * @param {string} pin
 * @param {string} panelistToken
 */
export async function fetchPitchPanelistPortfolioRemote(pin, panelistToken) {
  const client = assertClient();
  const { data, error } = await client.rpc('fetch_pitch_panelist_portfolio', {
    p_pin: pin,
    p_session_id: PITCH_PANEL_SESSION_ID,
    p_panelist_token: panelistToken,
  });
  if (error) throw new Error(error.message);
  return data ?? null;
}

/** @param {string} pin @param {string} panelistToken */
export async function finalizePitchPanelistPortfolioRemote(pin, panelistToken) {
  const client = assertClient();
  const { error } = await client.rpc('finalize_pitch_panelist_portfolio', {
    p_pin: pin,
    p_session_id: PITCH_PANEL_SESSION_ID,
    p_panelist_token: panelistToken,
  });
  if (error) throw new Error(error.message);
}

/** @param {string} panelistToken @param {string} [sessionId] */
export async function reopenPitchPanelistPortfolioRemote(panelistToken, sessionId = PITCH_PANEL_SESSION_ID) {
  const client = assertClient();
  const { data, error } = await client.rpc('reopen_pitch_panelist_portfolio', {
    p_session_id: sessionId,
    p_panelist_token: panelistToken,
  });
  if (error) throw new Error(error.message);
  return data ?? null;
}

/**
 * @param {string} pin
 * @param {string} panelistToken
 * @param {string} squadName
 */
export async function submitPitchPanelTieVoteRemote(pin, panelistToken, squadName) {
  const client = assertClient();
  const { error } = await client.rpc('submit_pitch_panel_tie_vote', {
    p_pin: pin,
    p_session_id: PITCH_PANEL_SESSION_ID,
    p_panelist_token: panelistToken,
    p_squad_name: squadName,
  });
  if (error) throw new Error(error.message);
}

/** @param {string} squadName @param {string} [sessionId] */
export async function fetchPitchPanelSquadInvestmentsRemote(squadName, sessionId = PITCH_PANEL_SESSION_ID) {
  const client = assertClient();
  const { data, error } = await client.rpc('fetch_pitch_panel_squad_investments', {
    p_squad_name: squadName,
    p_session_id: sessionId,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data : [];
}

/** @deprecated Use fetchPitchPanelSquadInvestmentsRemote */
export async function fetchPitchPanelSquadFeedbackRemote(squadName, sessionId = PITCH_PANEL_SESSION_ID) {
  return fetchPitchPanelSquadInvestmentsRemote(squadName, sessionId);
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

/** @param {string} [sessionId] */
export async function fetchPitchPanelCoachMatrixRemote(sessionId = PITCH_PANEL_SESSION_ID) {
  const client = assertClient();
  const { data, error } = await client.rpc('fetch_pitch_panel_coach_matrix', {
    p_session_id: sessionId,
  });
  if (error) throw new Error(error.message);
  return data ?? null;
}

/**
 * @param {Record<string, object>} squadResults
 */
export async function finalizePitchPanelRemote(squadResults) {
  const client = assertClient();
  const { error } = await client.rpc('finalize_pitch_panel', {
    p_session_id: PITCH_PANEL_SESSION_ID,
    p_squad_results: squadResults,
  });
  if (error) throw new Error(error.message);
}
