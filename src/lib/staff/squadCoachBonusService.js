/**
 * Coach / mentor discretionary squad bonus XP (local, per squad per week).
 */
import { SQUAD_COACH_BONUS_MAX } from './squadXpConstants.js';

const STORAGE_KEY = 'spike_squad_coach_bonus_v1';
const BONUS_EVENT = 'spike-squad-coach-bonus';

/** @param {string} squadName @param {number} week */
function bonusKey(squadName, week) {
  return `${squadName}:w${week}`;
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(all) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BONUS_EVENT));
  }
}

/** @param {string} squadName @param {number} [week] */
export function getSquadCoachBonus(squadName, week = 2) {
  const row = readAll()[bonusKey(squadName, week)];
  if (!row) {
    return { bonusXp: 0, note: '', savedAt: null, awardedBy: null, role: null };
  }
  return {
    bonusXp: Math.min(SQUAD_COACH_BONUS_MAX, Math.max(0, Number(row.bonusXp) || 0)),
    note: String(row.note ?? ''),
    savedAt: row.savedAt ?? null,
    awardedBy: row.awardedBy ?? null,
    role: row.role ?? null,
  };
}

/**
 * @param {string} staffId
 * @param {string} squadName
 * @param {number} week
 * @param {{ bonusXp: number, note?: string, role?: 'mentor' | 'faculty' }} input
 */
export function saveSquadCoachBonus(staffId, squadName, week, input) {
  const bonusXp = Math.min(
    SQUAD_COACH_BONUS_MAX,
    Math.max(0, Math.round(Number(input.bonusXp) || 0)),
  );
  const note = String(input.note ?? '').trim().slice(0, 200);
  const entry = {
    bonusXp,
    note: note || undefined,
    awardedBy: staffId,
    role: input.role ?? 'mentor',
    savedAt: new Date().toISOString(),
  };
  const all = readAll();
  if (bonusXp <= 0 && !note) {
    delete all[bonusKey(squadName, week)];
  } else {
    all[bonusKey(squadName, week)] = entry;
  }
  writeAll(all);
  return entry;
}

export { BONUS_EVENT as SQUAD_COACH_BONUS_EVENT };
