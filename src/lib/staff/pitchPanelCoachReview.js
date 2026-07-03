/**
 * Coach review — read panelist investment matrix and apply local adjustments before lock.
 */
import {
  PITCH_PANEL_COACH_MATRIX_CACHE_KEY,
  PITCH_PANEL_COACH_OVERRIDES_KEY,
  PITCH_PANEL_LIVE_STORAGE_KEY,
  PITCH_PANEL_SESSION_ID,
} from './pitchPanelConstants.js';
import { fetchPitchPanelCoachMatrixRemote } from '../supabase/pitchPanel.js';

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

/** @returns {{ cells: Record<string, Record<string, { amount: number, comment?: string }>> }} */
export function readCoachOverrides() {
  const raw = readJson(PITCH_PANEL_COACH_OVERRIDES_KEY, null);
  if (!raw || raw.sessionId !== PITCH_PANEL_SESSION_ID) {
    return { cells: {} };
  }
  return { cells: raw.cells ?? {} };
}

/** @param {Record<string, Record<string, { amount: number, comment?: string }>>} cells */
export function writeCoachOverrides(cells) {
  writeJson(PITCH_PANEL_COACH_OVERRIDES_KEY, {
    sessionId: PITCH_PANEL_SESSION_ID,
    cells,
    updatedAt: new Date().toISOString(),
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('spike-pitch-panel-coach-adjusted'));
  }
}

export function clearCoachOverrides() {
  localStorage.removeItem(PITCH_PANEL_COACH_OVERRIDES_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('spike-pitch-panel-coach-adjusted'));
  }
}

/** @param {ReturnType<typeof readCoachOverrides>} overrides */
export function hasCoachOverrides(overrides) {
  const cells = overrides?.cells ?? {};
  return Object.values(cells).some((row) => Object.keys(row).length > 0);
}

/**
 * @param {string} panelistToken
 * @param {string} squadName
 * @param {number} baseAmount
 * @param {ReturnType<typeof readCoachOverrides>} overrides
 */
export function getEffectiveAmount(panelistToken, squadName, baseAmount, overrides) {
  const cell = overrides?.cells?.[panelistToken]?.[squadName];
  if (cell != null && cell.amount != null && !Number.isNaN(Number(cell.amount))) {
    return Math.max(0, Number(cell.amount));
  }
  return Math.max(0, Number(baseAmount) || 0);
}

/**
 * @param {{ panelists: Array<{ panelistToken: string, allocations?: Array<{ squadName: string, amount?: number }> }> }} matrix
 * @param {ReturnType<typeof readCoachOverrides>} overrides
 * @param {string[]} squadNames
 */
export function computeEffectiveSquadTotals(matrix, overrides, squadNames) {
  /** @type {Record<string, number>} */
  const totals = {};
  for (const squad of squadNames) {
    let sum = 0;
    for (const panelist of matrix.panelists ?? []) {
      const base =
        panelist.allocations?.find((a) => a.squadName === squad)?.amount ?? 0;
      sum += getEffectiveAmount(panelist.panelistToken, squad, base, overrides);
    }
    totals[squad] = sum;
  }
  return totals;
}

/** @param {object | null} matrix */
export function writeCoachMatrixCache(matrix) {
  if (!matrix) return;
  writeJson(PITCH_PANEL_COACH_MATRIX_CACHE_KEY, {
    sessionId: PITCH_PANEL_SESSION_ID,
    ...matrix,
    cachedAt: new Date().toISOString(),
  });
}

/** @returns {object | null} */
export function readCoachMatrixCache() {
  const raw = readJson(PITCH_PANEL_COACH_MATRIX_CACHE_KEY, null);
  if (!raw || raw.sessionId !== PITCH_PANEL_SESSION_ID) return null;
  return raw;
}

/** @returns {object | null} */
function readLivePanelCacheLocal() {
  const raw = readJson(PITCH_PANEL_LIVE_STORAGE_KEY, null);
  if (!raw || raw.sessionId !== PITCH_PANEL_SESSION_ID) return null;
  return raw;
}

/** @param {string[]} fallbackSquads */
export async function loadPitchPanelCoachMatrix(fallbackSquads = []) {
  const live = readLivePanelCacheLocal();
  if (live?.coachMatrix?.panelists?.length) {
    writeCoachMatrixCache(live.coachMatrix);
    return live.coachMatrix;
  }

  try {
    const remote = await fetchPitchPanelCoachMatrixRemote();
    if (remote) {
      writeCoachMatrixCache(remote);
      return remote;
    }
  } catch {
    /* try cache below */
  }

  const cached = readCoachMatrixCache();
  if (cached?.panelists?.length) return cached;

  if (live?.coachMatrix) {
    writeCoachMatrixCache(live.coachMatrix);
    return live.coachMatrix;
  }

  return {
    sessionId: PITCH_PANEL_SESSION_ID,
    sessionFinalized: Boolean(live?.finalized),
    squads: fallbackSquads,
    panelists: [],
  };
}

/**
 * Build per-squad investment cards from effective matrix (for portfolio sync at finalize).
 * @param {string} squadName
 * @param {{ panelists: Array<object> }} matrix
 * @param {ReturnType<typeof readCoachOverrides>} overrides
 */
export function buildEffectiveSquadCards(squadName, matrix, overrides) {
  return (matrix.panelists ?? [])
    .map((p) => {
      const base = p.allocations?.find((a) => a.squadName === squadName);
      const amount = getEffectiveAmount(
        p.panelistToken,
        squadName,
        base?.amount ?? 0,
        overrides,
      );
      const comment =
        overrides?.cells?.[p.panelistToken]?.[squadName]?.comment ?? base?.comment ?? '';
      return {
        panelistName: p.panelistName,
        panelistOrg: p.panelistOrg,
        amount,
        comment,
        isFinal: true,
      };
    })
    .filter((c) => c.amount > 0);
}
