/** @typedef {'research_summary' | 'presentation' | 'interview_notes' | 'worksheet' | 'business_plan' | 'other'} PortfolioDeliverableCategory */

export const PORTFOLIO_DELIVERABLE_MAX_BYTES = 15 * 1024 * 1024;

export const PORTFOLIO_DELIVERABLE_CATEGORIES = /** @type {const} */ ([
  { id: 'research_summary', label: 'Research summary' },
  { id: 'presentation', label: 'Presentation (PPT/PDF)' },
  { id: 'interview_notes', label: 'Interview notes' },
  { id: 'worksheet', label: 'Worksheet / activity output' },
  { id: 'business_plan', label: 'Business plan draft' },
  { id: 'other', label: 'Other deliverable' },
]);

const EXTENSION_MIME = {
  pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt: 'application/vnd.ms-powerpoint',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  txt: 'text/plain',
};

export const PORTFOLIO_DELIVERABLE_ACCEPT =
  '.pdf,.pptx,.ppt,.docx,.doc,.jpg,.jpeg,.png,.webp,.txt,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,image/jpeg,image/png,image/webp,text/plain';

/** @param {string} fileName */
export function inferDeliverableMimeType(fileName, fallback = 'application/octet-stream') {
  const ext = String(fileName ?? '')
    .split('.')
    .pop()
    ?.toLowerCase();
  if (!ext) return fallback;
  return EXTENSION_MIME[ext] ?? fallback;
}

/** @param {PortfolioDeliverableCategory} category */
export function deliverableCategoryLabel(category) {
  return PORTFOLIO_DELIVERABLE_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

/** @param {number} bytes */
export function formatDeliverableFileSize(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
