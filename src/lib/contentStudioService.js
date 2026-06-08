import { getCurriculumDataSource } from './curriculumService.js';
import { listDays, listSegments, listWeeks } from './contentLoader.js';
import {
  fetchContentAssets,
  fetchContentBlock,
  fetchContentBlocks,
  fetchCurriculumTree,
  fetchDaySequence,
  saveDaySequence,
  updateContentBlockStatus,
  updateDayStatus,
  upsertContentAsset,
  upsertContentBlock,
} from './supabase/contentStudio.js';

export { CONTENT_STUDIO_NAV, CONTENT_STATUS, DAY_TEMPLATE_SECTIONS } from './contentStudioConstants.js';

/** @returns {Promise<'json' | 'hybrid' | 'db'>} */
export async function getContentStudioDataSource() {
  try {
    const tree = await fetchCurriculumTree();
    if (tree.segments?.length) return 'db';
  } catch {
    // Supabase unavailable — fall back to JSON
  }
  return getCurriculumDataSource();
}

/** Curriculum tree for Content Studio (DB first, JSON fallback). */
export async function loadCurriculumTreeForStudio() {
  try {
    const db = await fetchCurriculumTree();
    if (db.segments?.length) {
      return { source: 'db', ...db };
    }
  } catch {
    // fall through
  }

  const segments = listSegments().map((s) => ({
    id: s.id,
    slug: s.id,
    title: s.title,
    description: s.description ?? '',
    hours: s.hours ?? null,
    status: 'published',
    sort_order: s.segmentNumber ?? 1,
  }));

  const weeks = listWeeks().map((w) => ({
    id: w.id,
    segment_id: w.segmentId,
    slug: w.id,
    title: w.title,
    theme: w.theme ?? '',
    description: w.description ?? '',
    status: 'published',
    week_number: w.weekNumber,
    sort_order: w.weekNumber,
  }));

  const days = listDays().map((d) => ({
    id: d.id,
    week_id: d.weekId,
    slug: d.id,
    title: d.title,
    theme: d.theme ?? '',
    description: '',
    day_number: d.dayNumber,
    estimated_hours: d.durationHours ?? null,
    status: 'published',
    learning_objectives: d.learningObjectives ?? [],
    deliverables: d.expectedOutputs ?? [],
  }));

  return { source: 'json', segments, weeks, days, sessions: [] };
}

export {
  fetchContentAssets,
  fetchContentBlock,
  fetchContentBlocks,
  fetchDaySequence,
  saveDaySequence,
  updateContentBlockStatus,
  updateDayStatus,
  upsertContentAsset,
  upsertContentBlock,
};
