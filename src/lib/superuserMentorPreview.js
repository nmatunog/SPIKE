import {
  ensureSuperuserInternPreviewSeeded,
  SUPERUSER_INTERN_PREVIEW_PARTICIPANT_ID,
  SUPERUSER_MENTOR_PREVIEW_PEER_IDS,
} from './superuserInternPreviewData.js';

export const SUPERUSER_MENTOR_PREVIEW_SQUAD = 'Squad Catalyst';

/** Sample squad for superuser "view as mentor" — Week 2 scoring preview. */
export const SUPERUSER_MENTOR_PREVIEW_INTERNS = [
  {
    id: SUPERUSER_INTERN_PREVIEW_PARTICIPANT_ID,
    name: 'Alex Rivera (Sample)',
    squad: SUPERUSER_MENTOR_PREVIEW_SQUAD,
    segment: 1,
    hours: 48,
  },
  {
    id: SUPERUSER_MENTOR_PREVIEW_PEER_IDS[0],
    name: 'Jamie Cruz (Sample)',
    squad: SUPERUSER_MENTOR_PREVIEW_SQUAD,
    segment: 1,
    hours: 40,
  },
  {
    id: SUPERUSER_MENTOR_PREVIEW_PEER_IDS[1],
    name: 'Sam Dela Rosa (Sample)',
    squad: SUPERUSER_MENTOR_PREVIEW_SQUAD,
    segment: 1,
    hours: 36,
  },
];

/**
 * Intern list for superuser mentor preview — stable sample squad with Week 2 activity.
 * @param {Array<object>} [allInterns]
 */
export function buildSuperuserMentorPreviewInterns(allInterns = []) {
  ensureSuperuserInternPreviewSeeded();
  if (allInterns.length >= 4) return allInterns;
  return SUPERUSER_MENTOR_PREVIEW_INTERNS;
}
