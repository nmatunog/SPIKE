/**
 * Venture Blueprint weighted completion engine (Sprint 05).
 */
import { BLUEPRINT_SECTION_WEIGHTS, fieldsForSection } from './blueprintSectionConstants.js';
import { getSectionFields } from './blueprintSectionStore.js';
import { computeCanvasCompletionPct } from './canvasService.js';
import { computeMarketIntelligenceCompletionPct } from './marketIntelligenceService.js';
import { getVisionPurposeCompletionPct } from './playbookProgress.js';
import { listLeadershipJournal } from './leadershipJournalService.js';

/**
 * @param {string} sectionSlug
 * @param {string} participantId
 */
export function computeSectionCompletionPct(sectionSlug, participantId) {
  if (!participantId) return 0;

  if (sectionSlug === 'canvas') {
    return computeCanvasCompletionPct(participantId);
  }
  if (sectionSlug === 'market-intelligence') {
    return computeMarketIntelligenceCompletionPct(participantId);
  }
  if (sectionSlug === 'vision-purpose') {
    const playbookPct = getVisionPurposeCompletionPct(participantId);
    const fields = getSectionFields(participantId, 'vision-purpose');
    const reflectionBonus =
      ['lessons_learned', 'personal_insights', 'growth_reflections'].filter(
        (k) => (fields[k] ?? '').trim().length >= 20,
      ).length * 5;
    return Math.min(100, Math.round(playbookPct * 0.7 + reflectionBonus));
  }

  const fields = fieldsForSection(sectionSlug);
  if (!fields.length) return 0;

  const values = getSectionFields(participantId, sectionSlug);
  const editable = fields.filter((f) => !f.computed);
  if (!editable.length) return 0;

  let filled = 0;
  for (const field of editable) {
    const val = values[field.key] ?? '';
    const min = field.minChars ?? 10;
    if (String(val).trim().length >= min) filled += 1;
  }

  let pct = Math.round((filled / editable.length) * 100);

  if (sectionSlug === 'leadership-growth' && listLeadershipJournal(participantId).length > 0) {
    pct = Math.min(100, pct + 15);
  }

  return Math.min(100, pct);
}

/** @param {string} participantId */
export function computeBlueprintCompletion(participantId) {
  if (!participantId) return { composite: 0, sections: {} };

  const sections = {};
  let composite = 0;

  for (const [slug, weight] of Object.entries(BLUEPRINT_SECTION_WEIGHTS)) {
    const pct = computeSectionCompletionPct(slug, participantId);
    sections[slug] = pct;
    composite += (pct * weight) / 100;
  }

  return {
    composite: Math.round(Math.min(100, composite)),
    sections,
  };
}
