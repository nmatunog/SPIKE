/**
 * Sprint 02 reference data loaders — stable IDs for instructional architecture seeds.
 * @typedef {import('../types/playbook').Competency} Competency
 * @typedef {import('../types/playbook').Milestone} Milestone
 * @typedef {import('../types/playbook').WeekIntegration} WeekIntegration
 * @typedef {import('../types/playbook').BusinessPlanChapter} BusinessPlanChapter
 * @typedef {import('../types/playbook').PortfolioSection} PortfolioSection
 * @typedef {import('../types/playbook').CareerTrack} CareerTrack
 * @typedef {import('../types/playbook').TrackRequirement} TrackRequirement
 * @typedef {import('../types/playbook').VentureBoard} VentureBoard
 * @typedef {import('../types/playbook').VentureBoardCriterion} VentureBoardCriterion
 */

import competencies from '../data/seeds/competencies.json';
import milestones from '../data/seeds/milestones.json';
import weekIntegrations from '../data/seeds/weekIntegrations.json';
import businessPlanChapters from '../data/seeds/businessPlanChapters.json';
import portfolioSections from '../data/seeds/portfolioSections.json';
import careerTracks from '../data/seeds/careerTracks.json';
import trackRequirements from '../data/seeds/trackRequirements.json';
import ventureBoards from '../data/seeds/ventureBoards.json';
import ventureBoardCriteria from '../data/seeds/ventureBoardCriteria.json';

/** @param {string} id @param {string} label @param {Array<{ id: string }>} items */
function indexById(id, label, items) {
  const found = items.find((item) => item.id === id);
  if (!found) {
    throw new Error(`${label} not found: ${id}`);
  }
  return found;
}

/** @returns {Competency[]} */
export function getCompetencies() {
  return competencies;
}

/** @param {string} id @returns {Competency} */
export function getCompetencyById(id) {
  return indexById(id, 'Competency', competencies);
}

/** @returns {Milestone[]} */
export function getMilestones() {
  return milestones;
}

/** @param {string} segmentId @returns {Milestone[]} */
export function getMilestonesForSegment(segmentId) {
  return milestones.filter((milestone) => milestone.segmentId === segmentId);
}

/** @param {string} id @returns {Milestone} */
export function getMilestoneById(id) {
  return indexById(id, 'Milestone', milestones);
}

/** @returns {WeekIntegration[]} */
export function getWeekIntegrations() {
  return weekIntegrations;
}

/** @param {string} weekId @returns {WeekIntegration | undefined} */
export function getWeekIntegrationByWeekId(weekId) {
  return weekIntegrations.find((integration) => integration.weekId === weekId);
}

/** @returns {BusinessPlanChapter[]} */
export function getBusinessPlanChapters() {
  return businessPlanChapters;
}

/** @param {string} id @returns {BusinessPlanChapter} */
export function getBusinessPlanChapterById(id) {
  return indexById(id, 'BusinessPlanChapter', businessPlanChapters);
}

/** @param {number} weekNumber @returns {BusinessPlanChapter | undefined} */
export function getBusinessPlanChapterByWeek(weekNumber) {
  return businessPlanChapters.find((chapter) => chapter.weekOwner === weekNumber);
}

/** @returns {PortfolioSection[]} */
export function getPortfolioSections() {
  return portfolioSections;
}

/** @param {string} id @returns {PortfolioSection} */
export function getPortfolioSectionById(id) {
  return indexById(id, 'PortfolioSection', portfolioSections);
}

/** @returns {CareerTrack[]} */
export function getCareerTracks() {
  return careerTracks;
}

/** @param {string} id @returns {CareerTrack} */
export function getCareerTrackById(id) {
  return indexById(id, 'CareerTrack', careerTracks);
}

/** @returns {TrackRequirement[]} */
export function getTrackRequirements() {
  return trackRequirements;
}

/** @param {string} trackId @returns {TrackRequirement[]} */
export function getTrackRequirementsForTrack(trackId) {
  return trackRequirements.filter((requirement) => requirement.trackId === trackId);
}

/** @returns {VentureBoard[]} */
export function getVentureBoards() {
  return ventureBoards;
}

/** @param {string} segmentId @returns {VentureBoard[]} */
export function getVentureBoardsForSegment(segmentId) {
  return ventureBoards.filter((board) => board.segmentId === segmentId);
}

/** @param {string} id @returns {VentureBoard} */
export function getVentureBoardById(id) {
  return indexById(id, 'VentureBoard', ventureBoards);
}

/** @returns {VentureBoardCriterion[]} */
export function getVentureBoardCriteria() {
  return ventureBoardCriteria;
}

/** @param {string} boardId @returns {VentureBoardCriterion[]} */
export function getVentureBoardCriteriaForBoard(boardId) {
  return ventureBoardCriteria.filter((criterion) => criterion.boardId === boardId);
}

/** Stable week IDs for Segment 1 (Weeks 1–5). */
export const SEGMENT_1_WEEK_IDS = [
  'week-segment-1-1',
  'week-segment-1-2',
  'week-segment-1-3',
  'week-segment-1-4',
  'week-segment-1-5',
];
