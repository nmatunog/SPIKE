/** @param {string} pathname */
export function isPublicCoachDeckPath(pathname) {
  return /^\/content\/(?:segment-1|ra-spike)\/week-\d+\/day-\d+\/faculty-deck-\d+\.(?:pptx|pdf|ppt)$/i.test(
    pathname,
  );
}

/** @param {string} pathname */
export function isProtectedCoachDeckStoragePath(pathname) {
  return pathname.startsWith('/_protected/coach-decks/');
}

/**
 * @param {string} raw
 * @returns {string | null}
 */
export function sanitizeCoachDeckRelativePath(raw) {
  const path = String(raw ?? '')
    .replace(/^\/+/, '')
    .replace(/\\/g, '/');
  if (!path || path.includes('..')) return null;
  if (
    !/^(?:segment-1|ra-spike)\/week-\d+\/day-\d+\/faculty-deck-\d+\.(?:pptx|pdf|ppt)$/i.test(path)
  ) {
    return null;
  }
  return path;
}

/** @param {string} relPath */
export function coachDeckProtectedAssetPath(relPath) {
  return `/_protected/coach-decks/${relPath}`;
}

/**
 * @param {string | null | undefined} url
 * @returns {string | null}
 */
export function coachDeckApiUrlFromLegacyContentUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/^\/content\/((?:segment-1|ra-spike)\/week-\d+\/day-\d+\/faculty-deck-\d+\.(?:pptx|pdf|ppt))$/i);
  if (!match) return null;
  return `/api/coach/faculty-deck/${match[1]}`;
}

/** @param {string} relPath */
export function coachDeckApiUrl(relPath) {
  const safe = sanitizeCoachDeckRelativePath(relPath);
  return safe ? `/api/coach/faculty-deck/${safe}` : null;
}
