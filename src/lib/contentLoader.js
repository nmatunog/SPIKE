/**
 * File-based curriculum loader — Sprint 02 content tree under /content.
 * @typedef {import('../types/playbook').Segment} Segment
 * @typedef {import('../types/playbook').Week} Week
 * @typedef {import('../types/playbook').Day} Day
 * @typedef {import('../types/playbook').Presentation} Presentation
 * @typedef {import('../types/playbook').Slide} Slide
 * @typedef {import('../types/playbook').Activity} Activity
 * @typedef {import('../types/playbook').Worksheet} Worksheet
 * @typedef {import('../types/playbook').WorksheetQuestion} WorksheetQuestion
 * @typedef {import('../types/playbook').Assessment} Assessment
 * @typedef {import('../types/playbook').Rubric} Rubric
 * @typedef {import('../types/playbook').Survey} Survey
 * @typedef {import('../types/playbook').SurveyQuestion} SurveyQuestion
 * @typedef {import('../types/playbook').DayContribution} DayContribution
 * @typedef {import('../types/playbook').Session} Session
 * @typedef {import('../types/playbook').Reflection} Reflection
 * @typedef {import('../types/playbook').FacilitatorGuide} FacilitatorGuide
 */

/**
 * @typedef {Object} DayContentBundle
 * @property {Day} day
 * @property {{ presentation: Presentation, slides: Slide[] }} presentation
 * @property {{ activities: Activity[] }} activities
 * @property {{ worksheets: Worksheet[], questions: WorksheetQuestion[] }} worksheets
 * @property {{ assessment: Assessment, rubric: Rubric | null }} assessment
 * @property {{ survey: Survey, questions: SurveyQuestion[] }} survey
 * @property {DayContribution} contributions
 * @property {{ sessions: Session[] }} [sessions]
 * @property {{ reflections: Reflection[] }} [reflections]
 * @property {FacilitatorGuide} [facilitator]
 * @property {{ presentation: Presentation, slides: Slide[] }} [presentationDeck02]
 * @property {{ templates: Array<Record<string, unknown>> }} [evaluations]
 * @property {Record<string, unknown>} [mentorGuide]
 */

/**
 * @typedef {Object} WeekSummary
 * @property {string} slug
 * @property {Week} week
 * @property {string[]} daySlugs
 */

/**
 * @typedef {Object} SegmentSummary
 * @property {string} slug
 * @property {Segment} segment
 * @property {string[]} weekSlugs
 */

const contentModules = import.meta.glob('../../content/**/*.json', {
  eager: true,
  import: 'default',
});

/** @param {string} filePath */
function parseContentPath(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const match = normalized.match(
    /content\/(segment-[^/]+)(?:\/(week-[^/]+)(?:\/(day-[^/]+)\/([^/]+)\.json)?)?(?:\/([^/]+)\.json)?$/,
  );

  if (!match) return null;

  const [, segmentSlug, weekSlug, daySlug, dayFile, rootFile] = match;

  if (daySlug && dayFile) {
    return { segmentSlug, weekSlug, daySlug, fileName: dayFile };
  }

  if (weekSlug && rootFile === 'week') {
    return { segmentSlug, weekSlug, fileName: 'week' };
  }

  if (!weekSlug && rootFile === 'segment') {
    return { segmentSlug, fileName: 'segment' };
  }

  return null;
}

/** @type {Map<string, Segment>} */
const segmentBySlug = new Map();

/** @type {Map<string, Week>} */
const weekByKey = new Map();

/** @type {Map<string, Day>} */
const dayByKey = new Map();

/** @type {Map<string, Partial<DayContentBundle>>} */
const dayBundleByKey = new Map();

/** @type {Map<string, Set<string>>} */
const weekSlugsBySegment = new Map();

/** @type {Map<string, Set<string>>} */
const daySlugsByWeek = new Map();

for (const [filePath, data] of Object.entries(contentModules)) {
  const parsed = parseContentPath(filePath);
  if (!parsed) continue;

  const { segmentSlug, weekSlug, daySlug, fileName } = parsed;

  if (fileName === 'segment' && segmentSlug) {
    segmentBySlug.set(segmentSlug, /** @type {Segment} */ (data));
    if (!weekSlugsBySegment.has(segmentSlug)) {
      weekSlugsBySegment.set(segmentSlug, new Set());
    }
    continue;
  }

  if (fileName === 'week' && segmentSlug && weekSlug) {
    weekByKey.set(`${segmentSlug}/${weekSlug}`, /** @type {Week} */ (data));
    if (!weekSlugsBySegment.has(segmentSlug)) {
      weekSlugsBySegment.set(segmentSlug, new Set());
    }
    weekSlugsBySegment.get(segmentSlug).add(weekSlug);
    if (!daySlugsByWeek.has(`${segmentSlug}/${weekSlug}`)) {
      daySlugsByWeek.set(`${segmentSlug}/${weekSlug}`, new Set());
    }
    continue;
  }

  if (!segmentSlug || !weekSlug || !daySlug || !fileName) continue;

  const dayKey = `${segmentSlug}/${weekSlug}/${daySlug}`;
  if (!dayBundleByKey.has(dayKey)) {
    dayBundleByKey.set(dayKey, {});
    const weekKey = `${segmentSlug}/${weekSlug}`;
    if (!daySlugsByWeek.has(weekKey)) {
      daySlugsByWeek.set(weekKey, new Set());
    }
    daySlugsByWeek.get(weekKey).add(daySlug);
  }

  const bundle = dayBundleByKey.get(dayKey);

  switch (fileName) {
    case 'day':
      dayByKey.set(dayKey, /** @type {Day} */ (data));
      bundle.day = /** @type {Day} */ (data);
      break;
    case 'presentation':
      bundle.presentation = /** @type {DayContentBundle['presentation']} */ (data);
      break;
    case 'activities':
      bundle.activities = /** @type {DayContentBundle['activities']} */ (data);
      break;
    case 'worksheets':
      bundle.worksheets = /** @type {DayContentBundle['worksheets']} */ (data);
      break;
    case 'assessment':
      bundle.assessment = /** @type {DayContentBundle['assessment']} */ (data);
      break;
    case 'survey':
      bundle.survey = /** @type {DayContentBundle['survey']} */ (data);
      break;
    case 'contributions':
      bundle.contributions = /** @type {DayContribution} */ (data);
      break;
    case 'sessions':
      bundle.sessions = /** @type {DayContentBundle['sessions']} */ (data);
      break;
    case 'reflections':
      bundle.reflections = /** @type {DayContentBundle['reflections']} */ (data);
      break;
    case 'facilitator-guide':
      bundle.facilitator = /** @type {FacilitatorGuide} */ (data);
      break;
    case 'presentation-deck-02':
      bundle.presentationDeck02 = /** @type {DayContentBundle['presentationDeck02']} */ (data);
      break;
    case 'evaluations':
      bundle.evaluations = /** @type {DayContentBundle['evaluations']} */ (data);
      break;
    case 'mentor-guide':
      bundle.mentorGuide = /** @type {DayContentBundle['mentorGuide']} */ (data);
      break;
    default:
      break;
  }
}

const DAY_BUNDLE_FILES = [
  'day',
  'presentation',
  'activities',
  'worksheets',
  'assessment',
  'survey',
  'contributions',
];

/** @returns {SegmentSummary[]} */
export function listSegments() {
  return [...segmentBySlug.entries()]
    .map(([slug, segment]) => ({
      slug,
      segment,
      weekSlugs: [...(weekSlugsBySegment.get(slug) ?? [])].sort(),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * @param {string} segmentSlug
 * @returns {Segment | undefined}
 */
export function getSegment(segmentSlug) {
  return segmentBySlug.get(segmentSlug);
}

/**
 * @param {string} segmentSlug
 * @returns {WeekSummary[]}
 */
export function listWeeks(segmentSlug) {
  const weekSlugs = [...(weekSlugsBySegment.get(segmentSlug) ?? [])].sort();
  return weekSlugs.map((slug) => {
    const week = weekByKey.get(`${segmentSlug}/${slug}`);
    const daySlugs = [...(daySlugsByWeek.get(`${segmentSlug}/${slug}`) ?? [])].sort();
    return { slug, week, daySlugs };
  }).filter((entry) => entry.week);
}

/**
 * @param {string} segmentSlug
 * @param {string} weekSlug
 * @returns {Week | undefined}
 */
export function getWeek(segmentSlug, weekSlug) {
  return weekByKey.get(`${segmentSlug}/${weekSlug}`);
}

/**
 * @param {string} segmentSlug
 * @param {string} weekSlug
 * @returns {{ slug: string, day: Day }[]}
 */
export function listDays(segmentSlug, weekSlug) {
  const daySlugs = [...(daySlugsByWeek.get(`${segmentSlug}/${weekSlug}`) ?? [])].sort();
  return daySlugs
    .map((slug) => {
      const day = dayByKey.get(`${segmentSlug}/${weekSlug}/${slug}`);
      return day ? { slug, day } : null;
    })
    .filter(Boolean);
}

/**
 * @param {string} segmentSlug
 * @param {string} weekSlug
 * @param {string} daySlug
 * @returns {DayContentBundle | undefined}
 */
export function getDayContentBundle(segmentSlug, weekSlug, daySlug) {
  const key = `${segmentSlug}/${weekSlug}/${daySlug}`;
  const partial = dayBundleByKey.get(key);
  if (!partial?.day) return undefined;

  const missing = DAY_BUNDLE_FILES.filter((file) => {
    if (file === 'day') return !partial.day;
    return partial[file] === undefined;
  });

  if (missing.length > 0) {
    throw new Error(`Day bundle incomplete for ${key}: missing ${missing.join(', ')}`);
  }

  return /** @type {DayContentBundle} */ (partial);
}

/**
 * @param {DayContentBundle} bundle
 * @returns {Map<string, { presentation: Presentation, slides: Slide[] }>}
 */
export function getPresentationMap(bundle) {
  /** @type {Map<string, { presentation: Presentation, slides: Slide[] }>} */
  const map = new Map();
  if (bundle.presentation?.presentation) {
    map.set(bundle.presentation.presentation.id, bundle.presentation);
  }
  if (bundle.presentationDeck02?.presentation) {
    map.set(bundle.presentationDeck02.presentation.id, bundle.presentationDeck02);
  }
  return map;
}

/**
 * Order and filter slides to match presentation.slideIds (source of truth for deck length).
 * @param {{ presentation: Presentation, slides: Slide[] }} deck
 * @returns {Slide[]}
 */
export function resolvePresentationSlides(deck) {
  const { presentation, slides } = deck;
  if (!presentation?.slideIds?.length) return slides ?? [];
  const byId = new Map((slides ?? []).map((slide) => [slide.id, slide]));
  return presentation.slideIds.map((id) => byId.get(id)).filter(Boolean);
}

/**
 * @param {DayContentBundle} bundle
 * @param {string[]} presentationIds
 * @returns {Array<{ presentation: Presentation, slides: Slide[] }>}
 */
export function resolvePresentations(bundle, presentationIds) {
  const map = getPresentationMap(bundle);
  return presentationIds
    .map((id) => map.get(id))
    .filter(Boolean)
    .map((deck) => ({
      presentation: deck.presentation,
      slides: resolvePresentationSlides(deck),
    }));
}

/** Convenience path for acceptance criteria smoke checks. */
export function getSegment1Week1Day1Bundle() {
  return getDayContentBundle('segment-1', 'week-1', 'day-1');
}

/**
 * Validates the Segment 1 / Week 1 / Day 1 bundle shape.
 * @returns {DayContentBundle}
 */
export function assertSegment1Week1Day1Ready() {
  const bundle = getSegment1Week1Day1Bundle();
  if (!bundle) {
    throw new Error('Segment 1 / Week 1 / Day 1 bundle not found');
  }
  if (!bundle.day.learningObjectives?.length) {
    throw new Error('Day 1 missing learning objectives');
  }
  if (!bundle.presentation?.slides?.length) {
    throw new Error('Day 1 missing presentation slides');
  }
  if (!bundle.activities?.activities?.length) {
    throw new Error('Day 1 missing activities');
  }
  if (!bundle.worksheets?.questions?.length) {
    throw new Error('Day 1 missing worksheet questions');
  }
  if (!bundle.contributions?.contributesToPortfolio?.length) {
    throw new Error('Day 1 missing portfolio contributions');
  }
  if (!bundle.sessions?.sessions?.length) {
    throw new Error('Day 1 missing sessions');
  }
  if (!bundle.reflections?.reflections?.length) {
    throw new Error('Day 1 missing reflections');
  }
  if (!bundle.facilitator?.title) {
    throw new Error('Day 1 missing facilitator guide');
  }
  if (!bundle.presentationDeck02?.slides?.length) {
    throw new Error('Day 1 missing Program Coach Deck 02');
  }
  if (!bundle.evaluations?.templates?.length) {
    throw new Error('Day 1 missing evaluation templates');
  }
  if (!bundle.mentorGuide?.title) {
    throw new Error('Day 1 missing mentor guide');
  }
  const deck01 = bundle.presentation?.presentation?.id;
  if (deck01 !== 'presentation-day-1-deck-01') {
    throw new Error('Day 1 missing Program Coach Deck 01');
  }
  if (bundle.activities.activities.length < 8) {
    throw new Error('Day 1 requires 8 activity guides');
  }
  return bundle;
}

const WEEK1_DAY_SLUGS = ['day-1', 'day-2', 'day-3', 'day-4', 'day-5'];

/**
 * Validates Phase 2 content requirements for a Week 1 day bundle.
 * @param {DayContentBundle} bundle
 * @param {string} daySlug
 */
function assertWeek1DayBundleReady(bundle, daySlug) {
  const dayNum = bundle.day.dayNumber;
  if (!bundle.presentation?.slides?.length) {
    throw new Error(`Day ${dayNum} missing Program Coach Deck 01`);
  }
  if (!bundle.presentationDeck02?.slides?.length) {
    throw new Error(`Day ${dayNum} missing Program Coach Deck 02`);
  }
  if (!bundle.activities?.activities?.length || bundle.activities.activities.length < 4) {
    throw new Error(`Day ${dayNum} requires at least 4 activity guides`);
  }
  for (const act of bundle.activities.activities) {
    if (!act.debriefQuestions?.length) {
      throw new Error(`Day ${dayNum} activity ${act.id} missing debrief questions`);
    }
    if (!act.speakerNotes && !act.instructions?.length) {
      throw new Error(`Day ${dayNum} activity ${act.id} missing instructions`);
    }
  }
  for (const slide of bundle.presentation.slides) {
    if (!slide.imageUrl?.trim() && !slide.speakerNotes?.trim()) {
      throw new Error(`Day ${dayNum} Deck 01 slide "${slide.title}" missing speaker notes`);
    }
  }
  for (const slide of bundle.presentationDeck02.slides) {
    if (!slide.imageUrl?.trim() && !slide.speakerNotes?.trim()) {
      throw new Error(`Day ${dayNum} Deck 02 slide "${slide.title}" missing speaker notes`);
    }
  }
  if (!bundle.evaluations?.templates?.length) {
    throw new Error(`Day ${dayNum} missing evaluation templates`);
  }
  if (!bundle.mentorGuide?.coachingObjective) {
    throw new Error(`Day ${dayNum} missing mentor guide`);
  }
  if (!bundle.facilitator?.title) {
    throw new Error(`Day ${dayNum} missing facilitator guide`);
  }
  if (!bundle.sessions?.sessions?.length) {
    throw new Error(`Day ${dayNum} missing sessions`);
  }
  if (!bundle.reflections?.reflections?.length) {
    throw new Error(`Day ${dayNum} missing reflections`);
  }
  const deck01Id = `presentation-${daySlug}-deck-01`;
  if (bundle.presentation.presentation.id !== deck01Id && daySlug !== 'day-1') {
    throw new Error(`Day ${dayNum} Deck 01 id mismatch: expected ${deck01Id}`);
  }
}

/**
 * Validates Segment 1 / Week 1 / Days 1–5 (Phase 2 complete).
 * @returns {DayContentBundle[]}
 */
export function assertSegment1Week1Ready() {
  const bundles = WEEK1_DAY_SLUGS.map((slug) => {
    const bundle = getDayContentBundle('segment-1', 'week-1', slug);
    if (!bundle) throw new Error(`Week 1 ${slug} bundle not found`);
    if (slug === 'day-1') {
      assertSegment1Week1Day1Ready();
    } else {
      assertWeek1DayBundleReady(bundle, slug);
    }
    return bundle;
  });
  return bundles;
}

/** RA-SPIKE curriculum — see {@link ./raSpikeContentLoader.js} */
export { getRaSpikeWeekContent, getRaSpikeProgramMeta } from './raSpikeContentLoader.js';
