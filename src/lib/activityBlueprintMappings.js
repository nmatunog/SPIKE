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
    artifactTitle: 'Personal Why Statement',
    sourceDayId: 'day-segment-1-week-1-day-1',
  },
};

/** @param {string} worksheetId */
export function getWorksheetMapping(worksheetId) {
  return WORKSHEET_BLUEPRINT_MAPPINGS[worksheetId] ?? null;
}
