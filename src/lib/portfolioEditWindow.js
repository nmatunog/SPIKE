/** Grace period for refining portfolio inputs after first submission (7 days during pilot). */
export const PORTFOLIO_EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * @param {string | null | undefined} completedAt
 * @param {string | null | undefined} [firstCompletedAt]
 */
export function canEditPortfolioInput(completedAt, firstCompletedAt = null) {
  if (!completedAt) return true;
  const anchor = firstCompletedAt ?? completedAt;
  const elapsed = Date.now() - new Date(anchor).getTime();
  return elapsed < PORTFOLIO_EDIT_WINDOW_MS;
}

/**
 * @param {string | null | undefined} completedAt
 * @param {string | null | undefined} [firstCompletedAt]
 */
export function portfolioEditDeadline(completedAt, firstCompletedAt = null) {
  const anchor = firstCompletedAt ?? completedAt;
  if (!anchor) return null;
  return new Date(new Date(anchor).getTime() + PORTFOLIO_EDIT_WINDOW_MS);
}

/**
 * @param {string | null | undefined} completedAt
 * @param {string | null | undefined} [firstCompletedAt]
 */
export function portfolioEditGraceRemainingLabel(completedAt, firstCompletedAt = null) {
  const deadline = portfolioEditDeadline(completedAt, firstCompletedAt);
  if (!deadline) return null;
  const remainingMs = deadline.getTime() - Date.now();
  if (remainingMs <= 0) return null;

  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
  if (totalMinutes < 60) {
    return `${totalMinutes} minute${totalMinutes === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * @param {{ completedAt?: string | null, firstCompletedAt?: string | null, refining?: boolean }} entry
 */
export function isDay1BuilderEditLocked(entry) {
  if (!entry?.completedAt) return false;
  if (entry.refining) return false;
  return !canEditPortfolioInput(entry.completedAt, entry.firstCompletedAt);
}

/** @param {{ completedAt?: string | null, refining?: boolean }} entry */
export function canRefineDay1Builder(entry) {
  return Boolean(entry?.completedAt && !entry.refining);
}

/**
 * @param {{ completedAt?: string | null, firstCompletedAt?: string | null, refining?: boolean }} entry
 */
export function isPortfolioInputEditLocked(entry) {
  if (!entry?.completedAt) return false;
  if (entry.refining) return false;
  return !canEditPortfolioInput(entry.completedAt, entry.firstCompletedAt);
}

/**
 * @param {{ completedAt?: string | null, firstCompletedAt?: string | null, refining?: boolean }} entry
 */
export function canRefinePortfolioInput(entry) {
  if (!entry?.completedAt || entry.refining) return false;
  return canEditPortfolioInput(entry.completedAt, entry.firstCompletedAt);
}
