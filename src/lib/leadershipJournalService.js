/**
 * Leadership Journal — coaching notes destination (Sprint 05).
 */
import {
  fetchLeadershipJournal,
  insertLeadershipJournalEntry,
} from './supabase/leadershipJournal.js';
import { setSectionField } from './blueprintSectionStore.js';

const STORAGE_KEY = 'spike_leadership_journal_v1';

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

/**
 * @param {string} participantId
 * @param {{ mentorId?: string, topic?: string, notes: string, themes?: string, actionPlan?: string, sourceId?: string }} input
 */
export async function appendLeadershipJournalEntry(participantId, input) {
  const entry = {
    id: `lj-${crypto.randomUUID()}`,
    mentorId: input.mentorId ?? null,
    topic: input.topic ?? 'Coaching session',
    notes: input.notes,
    themes: input.themes ?? '',
    actionPlan: input.actionPlan ?? '',
    sourceId: input.sourceId ?? null,
    createdAt: new Date().toISOString(),
  };

  const all = readAll();
  const list = all[participantId] ?? [];
  list.unshift(entry);
  all[participantId] = list.slice(0, 50);
  writeAll(all);

  void insertLeadershipJournalEntry(participantId, {
    mentorId: input.mentorId,
    topic: entry.topic,
    notes: entry.notes,
    themes: entry.themes,
    actionPlan: entry.actionPlan,
    sourceId: entry.sourceId,
  });

  // Sync themes into leadership-growth section
  if (entry.themes) {
    setSectionField(participantId, 'leadership-growth', 'coaching_themes', entry.themes, {
      append: true,
      sourceType: 'coaching',
      sourceId: entry.id,
    });
  }
  setSectionField(participantId, 'leadership-growth', 'mentor_notes_summary', entry.notes, {
    append: true,
    sourceType: 'coaching',
    sourceId: entry.id,
  });
  if (entry.actionPlan) {
    setSectionField(participantId, 'leadership-growth', 'action_plans', entry.actionPlan, {
      append: true,
      sourceType: 'coaching',
      sourceId: entry.id,
    });
  }

  return entry;
}

/** @param {string} participantId */
export function listLeadershipJournal(participantId) {
  return readAll()[participantId] ?? [];
}

/** @param {string} participantId */
export async function hydrateLeadershipJournalFromSupabase(participantId) {
  if (!participantId) return;
  try {
    const rows = await fetchLeadershipJournal(participantId);
    if (!rows.length) return;
    const all = readAll();
    if ((all[participantId] ?? []).length > 0) return;
    all[participantId] = rows.map((r) => ({
      id: r.id,
      mentorId: r.mentor_id,
      topic: r.topic,
      notes: r.notes,
      themes: r.themes ?? '',
      actionPlan: r.action_plan ?? '',
      sourceId: r.source_id,
      createdAt: r.created_at,
    }));
    writeAll(all);
  } catch {
    /* offline */
  }
}
