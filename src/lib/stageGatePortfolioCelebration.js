/**
 * Pending stage gate projector celebration when an intern opens portfolio after pitch upload.
 */
const PENDING_KEY = 'spike_pending_portfolio_stage_gate_celebration';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(data));
  } catch {
    /* quota */
  }
}

/** @param {string} participantId @param {number} closingWeek */
export function queuePortfolioStageGateCelebration(participantId, closingWeek) {
  if (!participantId) return;
  const all = readAll();
  all[participantId] = {
    closingWeek,
    queuedAt: new Date().toISOString(),
  };
  writeAll(all);
}

/** @param {string} participantId */
export function readPendingPortfolioCelebration(participantId) {
  if (!participantId) return null;
  const entry = readAll()[participantId];
  if (!entry?.closingWeek) return null;
  return entry;
}

/** @param {string} participantId */
export function clearPendingPortfolioCelebration(participantId) {
  if (!participantId) return;
  const all = readAll();
  delete all[participantId];
  writeAll(all);
}
