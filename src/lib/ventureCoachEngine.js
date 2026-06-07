/**
 * AI Venture Coach™ — guided draft generation and refinement (local coach engine).
 */
import {
  AMBITION_MOTIVATOR_CARDS,
  COACH_VALUE_CARDS,
  ENTREPRENEURSHIP_FOLLOWUP,
  FUTURE_SELF_GOALS,
  INCOME_SLIDER_LABELS,
  LEADERSHIP_FOLLOWUP,
  PURPOSE_DRIVERS,
} from './ventureCoachConstants.js';

/** @param {Array<{ id: string, label: string }>} options @param {string[]} ids */
function labelsFor(options, ids) {
  return ids.map((id) => options.find((o) => o.id === id)?.label).filter(Boolean);
}

/**
 * @param {string[]} selectedMotivators
 * @returns {Array<{ id: string, prompt: string, options: Array<{ id: string, label: string }> }>}
 */
export function getAmbitionFollowUps(selectedMotivators) {
  const followUps = [];
  if (selectedMotivators.includes('entrepreneurship')) {
    followUps.push({
      id: 'entrepreneurship',
      prompt: 'You selected Entrepreneurship.\n\nWould you rather:',
      options: ENTREPRENEURSHIP_FOLLOWUP,
    });
  }
  if (selectedMotivators.includes('leadership')) {
    followUps.push({
      id: 'leadership',
      prompt: 'What appeals most to you about leadership?',
      options: LEADERSHIP_FOLLOWUP,
    });
  }
  return followUps;
}

/**
 * @param {Record<string, unknown>} data
 */
export function generateAmbitionDraft(data) {
  const motivators = labelsFor(AMBITION_MOTIVATOR_CARDS, data.selectedMotivators ?? []);
  const focus = motivators.length ? motivators.join(', ').toLowerCase() : 'building a meaningful venture';
  const followUp = data.followUpAnswers ?? {};
  let path = '';
  if (followUp.entrepreneurship) {
    const label = ENTREPRENEURSHIP_FOLLOWUP.find((o) => o.id === followUp.entrepreneurship)?.label;
    if (label) path = ` I want to ${label.toLowerCase()}.`;
  }
  if (followUp.leadership) {
    const label = LEADERSHIP_FOLLOWUP.find((o) => o.id === followUp.leadership)?.label;
    if (label) path += ` Leadership means ${label.toLowerCase()} to me.`;
  }
  return `I aspire to build a successful financial services venture centered on ${focus}, helping individuals and families achieve financial security while creating opportunities for future leaders and entrepreneurs.${path}`.trim();
}

/**
 * @param {Record<string, unknown>} data
 */
export function generatePurposeDraft(data) {
  const drivers = labelsFor(PURPOSE_DRIVERS, data.drivers ?? []);
  const detail = String(data.whyDetail ?? '').trim();
  const driverText = drivers.length ? drivers.join(', ').toLowerCase() : 'making a difference';
  const detailText = detail ? ` ${detail}` : '';
  return `My purpose is to help individuals and families make better financial decisions, driven by ${driverText}.${detailText} I want to create opportunities that improve lives and strengthen communities.`.replace(/\.\./g, '.').trim();
}

/**
 * @param {string[]} topFive
 */
export function generateValuesProfile(topFive) {
  const names = labelsFor(COACH_VALUE_CARDS, topFive);
  if (names.length < 5) return '';
  return `Your choices suggest that you are motivated by ${names.slice(0, 3).join(', ').toLowerCase()}, and ${names[3].toLowerCase()}, and ${names[4].toLowerCase()}. You may thrive in environments that allow you to create meaningful impact while continuously improving yourself and helping others.`;
}

/**
 * @param {Record<string, unknown>} data
 */
export function generateFutureSelfNarrative(data) {
  const goals = labelsFor(FUTURE_SELF_GOALS, data.goals ?? []);
  const income = INCOME_SLIDER_LABELS.find((l) => l.value === data.incomeLevel)?.label ?? 'sustainable income';
  const impact = String(data.impact ?? 'helping families achieve financial security').trim();
  const success = String(data.successVision ?? 'leading with confidence and integrity').trim();
  const goalLine = goals.length ? goals.join(', ') : 'building my venture';
  return [
    'In three years, I see myself as a venture builder who has moved from potential to measurable progress.',
    `I am focused on ${goalLine.toLowerCase()}, earning at a level that represents ${income.toLowerCase()}.`,
    `The impact I want to create: ${impact}.`,
    `Success looks like ${success}.`,
    'I am building skills, relationships, and systems that compound — not just hitting targets, but becoming the leader my future venture requires.',
    'Along the way, I stay grounded in my values, invest in my growth, and bring others with me as I scale my practice and my influence.',
  ].join(' ');
}

/** @param {string} text @param {string} mode */
export function refineText(text, mode) {
  const base = String(text ?? '').trim();
  if (!base) return base;
  switch (mode) {
    case 'ambitious':
      return `${base} I am committed to thinking bigger, taking bold action, and building a venture that creates lasting impact at scale.`;
    case 'personal':
      return base.replace(/\bI aspire\b/i, 'I personally aspire').replace(/\bMy purpose\b/i, 'For me, my purpose');
    case 'professional':
      return `${base} I will pursue this with discipline, professional excellence, and accountability to my clients and team.`;
    case 'shorten': {
      const sentences = base.split(/(?<=[.!?])\s+/).slice(0, 2);
      return sentences.join(' ');
    }
    case 'expand':
      return `${base} This vision guides my daily decisions, my learning priorities, and the standards I set for myself and those I serve.`;
    case 'rewrite':
      return base.split('. ').reverse().join('. ').replace(/\.\./g, '.');
    case 'realistic':
      return base.replace(/scale/gi, 'steady growth').replace(/bold action/gi, 'consistent action');
    case 'inspirational':
      return `${base} I believe this future is worth building — and I am ready to do the work to make it real.`;
    case 'longer':
      return `${base} Each milestone I reach reinforces my confidence that this path is mine to own, refine, and expand over the next decade.`;
    default:
      return base;
  }
}

/** @param {string} trackId */
export function ventureDirectionLabel(trackId) {
  if (trackId === 'agency_builder') return 'Agency Builder — build a team and agency';
  if (trackId === 'specialist_consultant') return 'Specialist Consultant — build expertise and niche practice';
  return 'Still exploring career path options';
}

/** @param {string} id @param {Array<{ id: string, label: string }>} options */
export function labelFor(id, options) {
  return options.find((o) => o.id === id)?.label ?? id;
}
