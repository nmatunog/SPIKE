/**
 * @typedef {Object} VentureStudioEvidence
 * @property {number} id
 * @property {'image' | 'note'} type
 * @property {string} title
 * @property {string} content
 */

/**
 * @typedef {Object} VentureStudioState
 * @property {number} currentStep
 * @property {number} highestStepReached
 * @property {boolean} isStarted
 * @property {boolean} isCanvasComplete
 * @property {boolean} showDay4Canvas
 * @property {string} squadName
 * @property {string} targetSegment
 * @property {{ description: string, stage: string, dayInLife: string, surprise: string }} step1
 * @property {{ goals: Record<string, boolean>, whyImportant: string }} step2
 * @property {Array<{ problem: string, evidence: string, confidence: string, images: unknown[] }>} step3
 * @property {Array<{ solution: string, advantages: string, limitations: string, opportunity: string }>} step4
 * @property {{ suggests: string, unmetNeed: string, valueCreation: string }} step5
 * @property {VentureStudioEvidence[]} evidenceList
 * @property {string | null} updatedAt
 */

export const VENTURE_STUDIO_STEPS = [
  {
    id: 1,
    action: 'DISCOVER',
    title: 'Who are they?',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    id: 2,
    action: 'UNDERSTAND',
    title: 'What matters most?',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    id: 3,
    action: 'PROBLEMS',
    title: 'Financial challenges',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    id: 4,
    action: 'SOLUTIONS',
    title: 'Current solutions',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  {
    id: 5,
    action: 'OPPORTUNITY',
    title: 'Your opportunity',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
];

export const GOAL_LABELS = {
  house: 'Buying a house',
  education: "Children's education",
  retirement: 'Retirement',
  business: 'Business growth',
  freedom: 'Financial freedom',
  security: 'Emergency security',
  travel: 'Travel / experiences',
  others: 'Others',
};
