/**
 * Versa export headers are locked (`VERSA_CSV_COLUMNS`). Optional `columnMap`
 * / `VERSA_CSV_COLUMN_MAP` only rename those fields when a file uses aliases.
 */

/** @param {Record<string, string | undefined> | null | undefined} env */
export function loadColumnMapFromEnv(env) {
  const raw = env?.VERSA_CSV_COLUMN_MAP;
  if (typeof raw !== 'string' || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    /** @type {Record<string, string>} */
    const out = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && value.trim()) out[key] = value.trim();
    }
    return out;
  } catch {
    return {};
  }
}

/** Later maps win. Body `columnMap` overrides env. */
export function mergeColumnMaps(...maps) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const map of maps) {
    if (!map || typeof map !== 'object' || Array.isArray(map)) continue;
    for (const [key, value] of Object.entries(map)) {
      if (typeof value === 'string' && value.trim()) out[key] = value.trim();
    }
  }
  return out;
}
