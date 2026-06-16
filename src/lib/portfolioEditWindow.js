/** Fallback grace after the program edit window closes (per-item window). */
export const PORTFOLIO_EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Default open-edit deadline for the founding cohort pilot. */
export const DEFAULT_PROGRAM_EDIT_UNTIL = '2026-06-30';

/**
 * End of program edit window (local 23:59:59.999).
 * Override with `VITE_PORTFOLIO_EDIT_UNTIL=YYYY-MM-DD` when needed.
 * @param {Date} [now]
 */
export function programEditCutoff(now = new Date()) {
  void now;
  const explicit = import.meta.env.VITE_PORTFOLIO_EDIT_UNTIL ?? DEFAULT_PROGRAM_EDIT_UNTIL;
  const parsed = new Date(`${explicit}T23:59:59.999`);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const fallback = new Date(`${DEFAULT_PROGRAM_EDIT_UNTIL}T23:59:59.999`);
  return fallback;
}

/** @deprecated Use programEditCutoff — kept for existing imports. */
export function cohortEditCutoffFriday(now = new Date()) {
  return programEditCutoff(now);
}

/** @param {Date} [now] */
export function isWithinCohortEditWindow(now = new Date()) {
  return now.getTime() <= programEditCutoff(now).getTime();
}

/** Human label for the program cutoff, e.g. "June 30, 2026". */
export function cohortEditCutoffLabel(now = new Date()) {
  return programEditCutoff(now).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * @param {string | null | undefined} completedAt
 * @param {string | null | undefined} [firstCompletedAt]
 */
export function canEditPortfolioInput(completedAt, firstCompletedAt = null) {
  if (isWithinCohortEditWindow()) return true;
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
  if (isWithinCohortEditWindow()) return programEditCutoff();
  const anchor = firstCompletedAt ?? completedAt;
  if (!anchor) return null;
  return new Date(new Date(anchor).getTime() + PORTFOLIO_EDIT_WINDOW_MS);
}

/**
 * @param {string | null | undefined} completedAt
 * @param {string | null | undefined} [firstCompletedAt]
 */
export function portfolioEditGraceRemainingLabel(completedAt, firstCompletedAt = null) {
  if (isWithinCohortEditWindow()) {
    const remainingMs = programEditCutoff().getTime() - Date.now();
    if (remainingMs <= 0) return null;
    const totalHours = Math.ceil(remainingMs / (60 * 60 * 1000));
    if (totalHours >= 48) {
      const days = Math.ceil(totalHours / 24);
      return `${days} day${days === 1 ? '' : 's'} (until ${cohortEditCutoffLabel()})`;
    }
    if (totalHours < 1) {
      const minutes = Math.ceil(remainingMs / (60 * 1000));
      return `${minutes} minute${minutes === 1 ? '' : 's'} (until ${cohortEditCutoffLabel()})`;
    }
    return `${totalHours} hour${totalHours === 1 ? '' : 's'} (until ${cohortEditCutoffLabel()})`;
  }

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
