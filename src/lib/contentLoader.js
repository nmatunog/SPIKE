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
  return bundle;
}
