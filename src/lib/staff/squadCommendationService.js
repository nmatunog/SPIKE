/**
 * Squad commendations — optional recognition, no XP impact. Max 3 per squad per week.
 */
import { getSectionField, setSectionField } from '../blueprintSectionStore.js';
import { appendBlueprintTimelineEvent } from '../blueprintTimeline.js';
import { COMMENDATION_TYPES, MAX_COMMENDATIONS_PER_SQUAD } from './squadXpConstants.js';

const STORAGE_KEY = 'spike_squad_commendations_v1';

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

function storageKey(squadName, week) {
  return `${squadName}:w${week}`;
}

/** @param {string} squadName @param {number} [week] */
export function getSquadCommendations(squadName, week = 2) {
  return readAll()[storageKey(squadName, week)]?.items ?? [];
}

/** @param {string} participantId @param {number} [week] */
export function getCommendationsForParticipant(participantId, week = 2) {
  const all = readAll();
  const results = [];
  for (const entry of Object.values(all)) {
    if (entry.week !== week) continue;
    for (const item of entry.items ?? []) {
      if (item.participantId === participantId) results.push(item);
    }
  }
  return results;
}

/**
 * @param {string} mentorId
 * @param {string} squadName
 * @param {number} week
 * @param {Array<{ participantId: string, participantName: string, typeId: string }>} items
 */
export function saveSquadCommendations(mentorId, squadName, week, items) {
  const trimmed = items.slice(0, MAX_COMMENDATIONS_PER_SQUAD).map((item) => {
    const type = COMMENDATION_TYPES.find((t) => t.id === item.typeId) ?? COMMENDATION_TYPES[0];
    return {
      participantId: item.participantId,
      participantName: item.participantName,
      typeId: type.id,
      label: type.label,
      emoji: type.emoji,
      awardedAt: new Date().toISOString(),
      mentorId,
    };
  });

  const all = readAll();
  all[storageKey(squadName, week)] = {
    squadName,
    week,
    mentorId,
    items: trimmed,
    savedAt: new Date().toISOString(),
  };
  writeAll(all);

  for (const item of trimmed) {
    syncCommendationToPortfolio(item.participantId, item, squadName, week);
  }

  return trimmed;
}

/** @param {string} participantId @param {object} item @param {string} squadName @param {number} week */
function syncCommendationToPortfolio(participantId, item, squadName, week) {
  const existing = getSectionField(participantId, 'market-intelligence', 'squad_commendations') ?? '';
  const lines = existing ? existing.split('\n').filter(Boolean) : [];
  const line = `${item.emoji} ${item.label} — Week ${week} (${squadName})`;
  if (!lines.includes(line)) lines.push(line);
  setSectionField(participantId, 'market-intelligence', 'squad_commendations', lines.join('\n'), {
    sourceType: 'squad-commendation',
    sourceId: `${week}-${item.typeId}`,
  });
  appendBlueprintTimelineEvent(participantId, {
    type: 'commendation',
    title: `${item.label} commendation earned`,
    module: 'squad-xp',
    sourceType: 'squad-commendation',
  });
}
