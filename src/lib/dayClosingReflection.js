import { getReflectionMapping } from './activityBlueprintMappings.js';

const CLOSING_REFLECTION_PATTERN = /^reflection-day-(\d+)-close$/;

/** @param {string} reflectionId */
export function isDayClosingReflection(reflectionId) {
  return CLOSING_REFLECTION_PATTERN.test(reflectionId);
}

/**
 * @param {string} reflectionId
 * @returns {number | null}
 */
export function dayNumberFromClosingReflectionId(reflectionId) {
  const match = reflectionId.match(CLOSING_REFLECTION_PATTERN);
  return match ? Number(match[1]) : null;
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
 * @param {{ reflections?: { reflections?: Array<{ id: string, title?: string, prompts?: string[], dayId?: string }> } }} bundle
 */
export function getDayClosingReflections(bundle) {
  const list = bundle?.reflections?.reflections ?? [];
  return list.filter((reflection) => isDayClosingReflection(reflection.id));
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
