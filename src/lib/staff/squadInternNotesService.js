/**
 * Per-intern coaching notes — qualitative feedback (not scored). Carried from legacy assessments.
 */
const STORAGE_KEY = 'spike_squad_intern_notes_v1';

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
 * @param {{
 *   week?: number,
 *   source: string,
 *   text: string,
 *   mentorId?: string,
 *   migratedFrom?: string,
 *   savedAt?: string,
 * }} input
 */
export function appendSquadInternNote(participantId, input) {
  const text = String(input.text ?? '').trim().slice(0, 4000);
  if (!participantId || !text) return null;

  const entry = {
    id: `note-${crypto.randomUUID()}`,
    week: input.week ?? 1,
    source: input.source,
    text,
    mentorId: input.mentorId ?? '',
    migratedFrom: input.migratedFrom,
    savedAt: input.savedAt ?? new Date().toISOString(),
  };

  const all = readAll();
  const list = all[participantId] ?? [];
  const dup = list.some(
    (n) => n.text === text && n.source === input.source && n.week === entry.week,
  );
  if (dup) return null;

  all[participantId] = [entry, ...list].slice(0, 40);
  writeAll(all);
  return entry;
}

/** @param {string} participantId @param {number} [week] */
export function listSquadInternNotes(participantId, week) {
  const list = readAll()[participantId] ?? [];
  if (week == null) return list;
  return list.filter((n) => n.week === week);
}

/** @param {string} participantId @param {number} week */
export function formatInternNotesBlock(participantId, week) {
  const notes = listSquadInternNotes(participantId, week);
  if (!notes.length) return '';
  return notes
    .slice(0, 5)
    .map((n) => `• ${n.text}`)
    .join('\n');
}

/** @param {Array<{ id: string, name: string }>} members @param {number} week */
export function buildSquadInternNotesAppendix(members, week) {
  const lines = [];
  for (const member of members) {
    const block = formatInternNotesBlock(member.id, week);
    if (block) {
      lines.push(`${member.name}:\n${block}`);
    }
  }
  return lines.join('\n\n');
}
