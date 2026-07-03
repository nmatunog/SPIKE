import { getReflectionMapping } from './activityBlueprintMappings.js';

const CLOSING_REFLECTION_PATTERN = /^reflection-day-(\d+)-close$/;
const WEEK_N_REFLECTION_PATTERN = /^reflection-w(\d+)-d(\d+)$/;

/** @param {string} reflectionId */
export function isDayClosingReflection(reflectionId) {
  return (
    CLOSING_REFLECTION_PATTERN.test(reflectionId)
    || WEEK_N_REFLECTION_PATTERN.test(reflectionId)
  );
}

/**
 * @param {string} reflectionId
 * @param {string} [dayId]
 * @returns {{ week: number, day: number } | null}
 */
export function weekDayFromReflectionMeta(reflectionId, dayId) {
  const wN = reflectionId.match(WEEK_N_REFLECTION_PATTERN);
  if (wN) return { week: Number(wN[1]), day: Number(wN[2]) };

  const w1 = reflectionId.match(CLOSING_REFLECTION_PATTERN);
  if (w1) return { week: 1, day: Number(w1[1]) };

  const fromDayId = String(dayId ?? '').match(/week-(\d+)-day-(\d+)/);
  if (fromDayId) {
    return { week: Number(fromDayId[1]), day: Number(fromDayId[2]) };
  }

  return null;
}

/**
 * @param {string} reflectionId
 * @returns {number | null}
 */
export function dayNumberFromClosingReflectionId(reflectionId) {
  const match = reflectionId.match(CLOSING_REFLECTION_PATTERN);
  if (match) return Number(match[1]);
  const wN = reflectionId.match(WEEK_N_REFLECTION_PATTERN);
  return wN ? Number(wN[2]) : null;
}

/**
 * @param {{ day?: { id?: string, dayNumber?: number, title?: string } }} bundle
 */
export function dayNumberFromBundle(bundle) {
  if (bundle?.day?.dayNumber) return bundle.day.dayNumber;
  const match = String(bundle?.day?.id ?? '').match(/day-(\d+)$/);
  return match ? Number(match[1]) : null;
}

/** @param {number | null | undefined} dayNumber */
export function dayClosingReflectionLabel(dayNumber) {
  return dayNumber ? `Day ${dayNumber} closing reflection` : 'Closing reflection';
}

/**
 * @param {{ reflections?: { reflections?: Array<object> } | Array<object> }} bundle
 * @returns {Array<{ id: string, title?: string, prompts?: string[], dayId?: string }>}
 */
export function normalizeBundleReflections(bundle) {
  const raw = bundle?.reflections;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return Array.isArray(raw.reflections) ? raw.reflections : [];
}

/**
 * End-of-playbook-day reflections interns must complete (Week 1–5).
 * @param {{ reflections?: { reflections?: Array<object> } | Array<object> }} bundle
 */
export function getPlaybookDayReflections(bundle) {
  return normalizeBundleReflections(bundle).filter((reflection) =>
    isDayClosingReflection(reflection.id),
  );
}

/**
 * @param {{ reflections?: { reflections?: Array<{ id: string, title?: string, prompts?: string[], dayId?: string }> } }} bundle
 */
export function getDayClosingReflections(bundle) {
  return getPlaybookDayReflections(bundle);
}

/**
 * @param {string} participantId
 * @param {string} [sectionId]
 */
export function listParticipantClosingReflections(participantId, sectionId) {
  if (!participantId) return [];

  let store;
  try {
    store = JSON.parse(localStorage.getItem('spike_playbook_progress_v1') || '{}');
  } catch {
    return [];
  }

  const reflections = store[participantId]?.reflections ?? {};
  const rows = [];

  for (const [id, entry] of Object.entries(reflections)) {
    if (!isDayClosingReflection(id)) continue;
    const mapping = getReflectionMapping(id);
    if (sectionId && mapping?.portfolioSectionId !== sectionId) continue;

    const responses = /** @type {Record<string, string>} */ (entry?.responses ?? {});
    const prompts = Object.keys(responses);
    const summary = prompts
      .map((prompt) => responses[prompt]?.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(' · ');

    rows.push({
      id,
      dayNumber: dayNumberFromClosingReflectionId(id),
      title: mapping?.artifactTitle ?? dayClosingReflectionLabel(dayNumberFromClosingReflectionId(id)),
      responses,
      summary,
      completedAt: entry?.completedAt ?? null,
      portfolioSectionId: mapping?.portfolioSectionId ?? null,
    });
  }

  return rows.sort((a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0));
}
