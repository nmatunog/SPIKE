/**
 * Venture Blueprint section entries — localStorage + Supabase (Sprint 05).
 */
import { upsertBlueprintEntry, fetchBlueprintEntries } from './supabase/blueprintEntries.js';
import { supabase } from '../supabaseClient.js';
import { isMockUserId } from './mockAuth.js';
import { shouldApplyRemoteField } from './syncMergeUtils.js';

const STORAGE_KEY = 'spike_blueprint_section_entries';

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
function ensureUser(participantId) {
  const all = readAll();
  if (!all[participantId]) all[participantId] = {};
  return all;
}

/**
 * @param {string} participantId
 * @param {string} sectionSlug
 * @param {string} fieldKey
 */
export function getSectionField(participantId, sectionSlug, fieldKey) {
  return readAll()[participantId]?.[sectionSlug]?.[fieldKey]?.value ?? '';
}

/**
 * @param {string} participantId
 * @param {string} sectionSlug
 */
export function getSectionFields(participantId, sectionSlug) {
  const section = readAll()[participantId]?.[sectionSlug] ?? {};
  return Object.fromEntries(
    Object.entries(section).map(([key, entry]) => [key, entry.value ?? '']),
  );
}

/**
 * @param {string} participantId
 * @param {string} sectionSlug
 * @param {string} fieldKey
 * @param {string} value
 * @param {{ sourceType?: string, sourceId?: string, append?: boolean }} [opts]
 */
function computeSectionFieldValue(participantId, sectionSlug, fieldKey, value, opts = {}) {
  const all = ensureUser(participantId);
  const section = all[participantId][sectionSlug] ?? {};
  const prev = section[fieldKey]?.value ?? '';
  return opts.append && prev
    ? `${prev.trim()}\n\n---\n${String(value).trim()}`
    : String(value);
}

function writeSectionFieldLocal(participantId, sectionSlug, fieldKey, nextValue, opts = {}) {
  const all = ensureUser(participantId);
  const section = all[participantId][sectionSlug] ?? {};
  section[fieldKey] = {
    value: nextValue,
    sourceType: opts.sourceType ?? section[fieldKey]?.sourceType,
    sourceId: opts.sourceId ?? section[fieldKey]?.sourceId,
    updatedAt: new Date().toISOString(),
  };
  all[participantId][sectionSlug] = section;
  writeAll(all);
  return nextValue;
}

/**
 * @param {string} participantId
 * @param {string} sectionSlug
 * @param {string} fieldKey
 * @param {string} value
 * @param {{ sourceType?: string, sourceId?: string, append?: boolean }} [opts]
 */
export function setSectionField(participantId, sectionSlug, fieldKey, value, opts = {}) {
  const nextValue = computeSectionFieldValue(participantId, sectionSlug, fieldKey, value, opts);
  writeSectionFieldLocal(participantId, sectionSlug, fieldKey, nextValue, opts);

  if (isMockUserId(participantId)) return nextValue;

  void upsertBlueprintEntry(participantId, sectionSlug, fieldKey, nextValue, {
    sourceType: opts.sourceType,
    sourceId: opts.sourceId,
  });

  return nextValue;
}

/**
 * Cloud-first: Supabase upsert, then local cache.
 * @param {string} participantId
 * @param {string} sectionSlug
 * @param {string} fieldKey
 * @param {string} value
 * @param {{ sourceType?: string, sourceId?: string, append?: boolean }} [opts]
 */
export async function setSectionFieldCloudFirst(participantId, sectionSlug, fieldKey, value, opts = {}) {
  const nextValue = computeSectionFieldValue(participantId, sectionSlug, fieldKey, value, opts);
  if (isMockUserId(participantId)) {
    return writeSectionFieldLocal(participantId, sectionSlug, fieldKey, nextValue, opts);
  }
  if (supabase && participantId) {
    const result = await upsertBlueprintEntry(participantId, sectionSlug, fieldKey, nextValue, {
      sourceType: opts.sourceType,
      sourceId: opts.sourceId,
    });
    if (!result) {
      throw new Error('Blueprint cloud save failed');
    }
  }
  return writeSectionFieldLocal(participantId, sectionSlug, fieldKey, nextValue, opts);
}

/** @param {string} participantId @param {{ preferRemote?: boolean, preferLocal?: boolean }} [opts] */
export async function hydrateBlueprintSectionsFromSupabase(participantId, opts = {}) {
  if (!participantId) return;
  try {
    const rows = await fetchBlueprintEntries(participantId);
    if (!rows.length) return;
    const all = ensureUser(participantId);
    for (const row of rows) {
      const section = all[participantId][row.section_slug] ?? {};
      const localEntry = section[row.field_key];
      const localUpdated = localEntry?.updatedAt;
      const remoteUpdated = row.updated_at;
      if (
        shouldApplyRemoteField(
          localEntry?.value,
          row.field_value ?? '',
          localUpdated,
          remoteUpdated,
          opts,
        )
      ) {
        section[row.field_key] = {
          value: row.field_value ?? '',
          sourceType: row.source_type,
          sourceId: row.source_id,
          updatedAt: row.updated_at,
        };
      }
      all[participantId][row.section_slug] = section;
    }
    writeAll(all);
  } catch {
    /* offline / migration not applied */
  }
}

export { readAll as readBlueprintStore };
