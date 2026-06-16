/** Fallback grace after cohort Friday cutoff (per-item window). */
export const PORTFOLIO_EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * End of Friday 23:59:59.999 for the current Mon–Sun week (local time).
 * Override with `VITE_PORTFOLIO_EDIT_UNTIL=YYYY-MM-DD` when needed.
 * @param {Date} [now]
 */
export function cohortEditCutoffFriday(now = new Date()) {
  const explicit = import.meta.env.VITE_PORTFOLIO_EDIT_UNTIL;
  if (explicit) {
    const parsed = new Date(`${explicit}T23:59:59.999`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const d = new Date(now);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const friday = new Date(d);
  friday.setDate(d.getDate() + mondayOffset + 4);
  friday.setHours(23, 59, 59, 999);
  return friday;
}

/** @param {Date} [now] */
export function isWithinCohortEditWindow(now = new Date()) {
  return now.getTime() <= cohortEditCutoffFriday(now).getTime();
}

/** Human label for the cohort cutoff, e.g. "Friday, Jun 20". */
export function cohortEditCutoffLabel(now = new Date()) {
  return cohortEditCutoffFriday(now).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
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
  if (isWithinCohortEditWindow()) return cohortEditCutoffFriday();
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
    const remainingMs = cohortEditCutoffFriday().getTime() - Date.now();
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
