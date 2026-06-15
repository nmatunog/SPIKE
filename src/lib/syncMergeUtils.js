/**
 * Shared rules for cloud ↔ local merge — never replace substantive local data with empty remote.
 */

/** @param {unknown} value */
export function fieldHasContent(value) {
  if (value == null) return false;
  if (typeof value === 'boolean' || typeof value === 'number') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    return Object.values(value).some((entry) => fieldHasContent(entry));
  }
  return String(value).trim().length > 0;
}

/**
 * @param {unknown} localValue
 * @param {unknown} remoteValue
 * @param {string | null | undefined} localUpdated
 * @param {string | null | undefined} remoteUpdated
 * @param {{ preferRemote?: boolean, preferLocal?: boolean }} [opts]
 */
export function shouldApplyRemoteField(
  localValue,
  remoteValue,
  localUpdated,
  remoteUpdated,
  opts = {},
) {
  const localContent = fieldHasContent(localValue);
  const remoteContent = fieldHasContent(remoteValue);

  if (!remoteContent) return false;
  if (!localContent) return true;

  if (opts.preferLocal) {
    if (!localUpdated) return false;
    if (!remoteUpdated) return false;
    return new Date(String(remoteUpdated)) > new Date(String(localUpdated));
  }

  if (opts.preferRemote) {
    if (!localUpdated) return true;
    if (!remoteUpdated) return false;
    return new Date(String(remoteUpdated)) >= new Date(String(localUpdated));
  }

  if (!localUpdated) return false;
  if (!remoteUpdated) return false;
  return new Date(String(remoteUpdated)) > new Date(String(localUpdated));
}

/**
 * @param {{ data?: Record<string, unknown> } | null | undefined} entry
 */
export function builderEntryHasContent(entry) {
  if (!entry?.data || typeof entry.data !== 'object') return false;
  return fieldHasContent(entry.data);
}
