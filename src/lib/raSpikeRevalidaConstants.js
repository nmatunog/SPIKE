/** Guest panelist access for RA-SPIKE Revalida rating (share with panelists). */
export const RA_SPIKE_REVALIDA_ACCESS_PIN = 'REVALIDA';

export const RA_SPIKE_REVALIDA_TOKEN_KEY = 'ra_spike_revalida_panelist_token_v1';
export const RA_SPIKE_REVALIDA_SESSION_KEY = 'ra_spike_revalida_panelist_session_v1';

/** @returns {string} */
export function readRevalidaPanelistToken() {
  try {
    let token = localStorage.getItem(RA_SPIKE_REVALIDA_TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(RA_SPIKE_REVALIDA_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return crypto.randomUUID();
  }
}

/** @returns {{ unlocked?: boolean, name?: string, org?: string, cohortId?: string } | null} */
export function readRevalidaGuestSession() {
  try {
    const raw = sessionStorage.getItem(RA_SPIKE_REVALIDA_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** @param {{ unlocked?: boolean, name?: string, org?: string, cohortId?: string }} snapshot */
export function writeRevalidaGuestSession(snapshot) {
  try {
    sessionStorage.setItem(RA_SPIKE_REVALIDA_SESSION_KEY, JSON.stringify(snapshot));
  } catch {
    /* private mode */
  }
}

export function clearRevalidaGuestSession() {
  try {
    sessionStorage.removeItem(RA_SPIKE_REVALIDA_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Full URL for panelists (works on portal or pages.dev). */
export function revalidaPanelistHref() {
  if (typeof window === 'undefined') return '/ra-spike/revalida-rating';
  return `${window.location.origin}/ra-spike/revalida-rating`;
}
