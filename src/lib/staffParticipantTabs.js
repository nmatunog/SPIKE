export const STAFF_PARTICIPANT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'venture', label: 'Venture' },
  { id: 'fec', label: 'FEC' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'feedback', label: 'Feedback' },
];

/** @param {string} [tab] */
export function normalizeStaffParticipantTab(tab) {
  const valid = STAFF_PARTICIPANT_TABS.map((t) => t.id);
  return valid.includes(tab ?? '') ? tab : 'overview';
}
