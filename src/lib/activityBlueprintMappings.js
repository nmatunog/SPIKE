/**
 * Playbook Integration Engine (PRD Engine 2) — activity → Blueprint routing.
 * @typedef {Object} WorksheetBlueprintMapping
 * @property {string} portfolioSectionId
 * @property {string} businessPlanChapterId
 * @property {string} blueprintModule
 * @property {number} completionWeight
 * @property {string} artifactTitle
 * @property {string} sourceDayId
 */

/** @type {Record<string, WorksheetBlueprintMapping>} */
export const WORKSHEET_BLUEPRINT_MAPPINGS = {
  'worksheet-day-1-personal-why': {
    portfolioSectionId: 'portfolio-identity-purpose',
    businessPlanChapterId: 'bp-chapter-1',
    blueprintModule: 'vision',
    completionWeight: 5,
    artifactTitle: 'My Impact Statement',
    sourceDayId: 'day-segment-1-week-1-day-1',
  },
};

/** @type {Record<string, WorksheetBlueprintMapping>} */
export const ACTIVITY_BLUEPRINT_MAPPINGS = {
  'activity-day-1-vision-board': {
    portfolioSectionId: 'portfolio-identity-purpose',
    businessPlanChapterId: 'bp-chapter-1',
    blueprintModule: 'vision',
    completionWeight: 3,
    artifactTitle: 'Squad Vision Board Output',
    sourceDayId: 'day-segment-1-week-1-day-1',
  },
  'activity-day-1-squad-charter': {
    portfolioSectionId: 'portfolio-identity-purpose',
    businessPlanChapterId: 'bp-chapter-1',
    blueprintModule: 'vision',
    completionWeight: 2,
    artifactTitle: 'Research Squad Charter',
    sourceDayId: 'day-segment-1-week-1-day-1',
  },
};

/** @type {Record<string, WorksheetBlueprintMapping>} */
export const REFLECTION_BLUEPRINT_MAPPINGS = {
  'reflection-day-1-close': {
    portfolioSectionId: 'portfolio-identity-purpose',
    businessPlanChapterId: 'bp-chapter-1',
    blueprintModule: 'vision',
    completionWeight: 2,
    artifactTitle: 'Day 1 Closing Reflection',
    sourceDayId: 'day-segment-1-week-1-day-1',
  },
};

/** @param {string} worksheetId */
export function getWorksheetMapping(worksheetId) {
  return WORKSHEET_BLUEPRINT_MAPPINGS[worksheetId] ?? null;
}

/** @param {string} activityId */
export function getActivityMapping(activityId) {
  return ACTIVITY_BLUEPRINT_MAPPINGS[activityId] ?? null;
}

/** @type {Record<string, WorksheetBlueprintMapping>} */
export const SURVEY_BLUEPRINT_MAPPINGS = {
  'survey-day-1-orientation': {
    portfolioSectionId: 'portfolio-market-intelligence',
    businessPlanChapterId: 'bp-chapter-2',
    blueprintModule: 'client-growth',
    completionWeight: 4,
    artifactTitle: 'Orientation Pulse Survey Insights',
    sourceDayId: 'day-segment-1-week-1-day-1',
  },
};

/** @param {string} reflectionId */
export function getReflectionMapping(reflectionId) {
  if (REFLECTION_BLUEPRINT_MAPPINGS[reflectionId]) {
    return REFLECTION_BLUEPRINT_MAPPINGS[reflectionId];
  }

  const dayMatch = reflectionId.match(/^reflection-day-(\d+)-close$/);
  const w2Match = reflectionId.match(/^reflection-w2-d(\d+)$/);
  if (!dayMatch && !w2Match) return null;

  const weekNum = w2Match ? 2 : 1;
  const dayNum = Number((w2Match ?? dayMatch)[1]);
  /** @type {Record<number, string>} */
  const portfolioByWeekDay = {
    '1-1': 'portfolio-identity-purpose',
    '1-2': 'portfolio-market-intelligence',
    '1-3': 'portfolio-market-intelligence',
    '1-4': 'portfolio-financial-blueprint',
    '1-5': 'portfolio-three-year-blueprint',
    '2-2': 'portfolio-market-intelligence',
    '2-3': 'portfolio-professional-development',
    '2-4': 'portfolio-financial-blueprint',
    '2-5': 'portfolio-advisor-startup',
  };
  /** @type {Record<string, string>} */
  const chapterByWeekDay = {
    '1-1': 'bp-chapter-1',
    '1-2': 'bp-chapter-2',
    '1-3': 'bp-chapter-2',
    '1-4': 'bp-chapter-3',
    '1-5': 'bp-chapter-5',
    '2-2': 'bp-chapter-2',
    '2-3': 'bp-chapter-2',
    '2-4': 'bp-chapter-3',
    '2-5': 'bp-chapter-5',
  };
  const key = `${weekNum}-${dayNum}`;

  return {
    portfolioSectionId: portfolioByWeekDay[key] ?? 'portfolio-identity-purpose',
    businessPlanChapterId: chapterByWeekDay[key] ?? 'bp-chapter-1',
    blueprintModule: weekNum === 1 && dayNum <= 2 ? 'vision' : 'client-growth',
    completionWeight: 2,
    artifactTitle: `Week ${weekNum} Day ${dayNum} Closing Reflection`,
    sourceDayId: `day-segment-1-week-${weekNum}-day-${dayNum}`,
  };
}

/** @param {string} surveyId */
export function getSurveyMapping(surveyId) {
  return SURVEY_BLUEPRINT_MAPPINGS[surveyId] ?? null;
}
