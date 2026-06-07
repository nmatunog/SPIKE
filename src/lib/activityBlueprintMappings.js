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
    artifactTitle: 'My Purpose Statement',
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
  return REFLECTION_BLUEPRINT_MAPPINGS[reflectionId] ?? null;
}

/** @param {string} surveyId */
export function getSurveyMapping(surveyId) {
  return SURVEY_BLUEPRINT_MAPPINGS[surveyId] ?? null;
}
