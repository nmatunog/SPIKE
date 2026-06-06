/** Research Squad foundation — seed data until Supabase wiring (PR7+). */

import squads from '../data/seeds/researchSquads.json';
import projects from '../data/seeds/researchProjects.json';

export const MARKET_SEGMENTS = [
  { id: 'gen_z', label: 'Gen Z' },
  { id: 'young_professionals', label: 'Young Professionals' },
  { id: 'families', label: 'Families' },
  { id: 'ofws', label: 'OFWs' },
  { id: 'business_owners', label: 'Business Owners' },
  { id: 'healthcare_professionals', label: 'Healthcare Professionals' },
];

export const RESEARCH_DELIVERABLES = [
  'Survey Results',
  'Opportunity Maps',
  'Customer Personas',
  'Presentation Decks',
  'Research Reports',
];

/** @returns {import('../types/playbook').ResearchSquad[]} */
export function getResearchSquads() {
  return squads;
}

/** @param {string} squadId */
export function getResearchProjectsForSquad(squadId) {
  return projects.filter((p) => p.squadId === squadId);
}

/** @returns {import('../types/playbook').ResearchProject[]} */
export function getResearchProjects() {
  return projects;
}

/** @param {string} segmentId */
export function getMarketSegmentLabel(segmentId) {
  return MARKET_SEGMENTS.find((s) => s.id === segmentId)?.label ?? segmentId;
}
