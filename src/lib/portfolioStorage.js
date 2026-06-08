/**
 * Venture Portfolio™ participant settings — privacy, slug, cover photo (Sprint 06C).
 */
const STORAGE_KEY = 'spike_venture_portfolio_settings';

/** @typedef {'private' | 'share_link' | 'public'} PortfolioPrivacy */

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** @param {string} participantId */
export function getPortfolioSettings(participantId) {
  const defaults = {
    privacy: /** @type {PortfolioPrivacy} */ ('private'),
    slug: '',
    photoUrl: '',
    updatedAt: null,
  };
  if (!participantId) return defaults;
  return { ...defaults, ...(readAll()[participantId] ?? {}) };
}

/**
 * @param {string} participantId
 * @param {Partial<{ privacy: PortfolioPrivacy, slug: string, photoUrl: string }>} patch
 */
export function savePortfolioSettings(participantId, patch) {
  if (!participantId) return getPortfolioSettings(participantId);
  const all = readAll();
  const current = getPortfolioSettings(participantId);
  const slug = patch.slug !== undefined ? sanitizeSlug(patch.slug) : current.slug;
  const next = {
    ...current,
    ...patch,
    slug,
    updatedAt: new Date().toISOString(),
  };
  all[participantId] = next;
  writeAll(all);
  return next;
}

/** @param {string} raw */
function sanitizeSlug(raw) {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/** @param {string} participantId @param {string} participantName */
export function ensurePortfolioSlug(participantId, participantName = '') {
  const current = getPortfolioSettings(participantId);
  if (current.slug) return current.slug;
  const base = sanitizeSlug(participantName) || `intern-${participantId.slice(0, 8)}`;
  return savePortfolioSettings(participantId, { slug: base }).slug;
}

/** @param {string} slug */
export function findParticipantIdByPortfolioSlug(slug) {
  const normalized = sanitizeSlug(slug);
  if (!normalized) return null;
  const all = readAll();
  for (const [participantId, settings] of Object.entries(all)) {
    if (settings.slug === normalized && settings.privacy !== 'private') {
      return participantId;
    }
  }
  return null;
}
