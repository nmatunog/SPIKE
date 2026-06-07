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

const MAX_AMBITION_WORDS = 50;
const MAX_PURPOSE_WORDS = 42;

/** @param {Array<{ id: string, label: string }>} options @param {string[]} ids */
function labelsFor(options, ids) {
  return ids.map((id) => options.find((o) => o.id === id)?.label).filter(Boolean);
}

/** @param {string[]} items @param {number} [max] */
function formatListNatural(items, max = 3) {
  const picked = items.slice(0, max);
  if (!picked.length) return '';
  if (picked.length === 1) return picked[0].toLowerCase();
  if (picked.length === 2) return `${picked[0].toLowerCase()} and ${picked[1].toLowerCase()}`;
  return `${picked.slice(0, -1).map((s) => s.toLowerCase()).join(', ')}, and ${picked[picked.length - 1].toLowerCase()}`;
}

/** @param {string} text @param {number} [maxLen] */
function firstPhrase(text, maxLen = 120) {
  const cleaned = String(text ?? '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  const sentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
  const trimmed = sentence.replace(/[.!?]+$/, '').trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1).trim()}…`;
}

/** @param {string} text @param {number} maxWords */
export function capStatementWords(text, maxWords) {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return `${words.slice(0, maxWords).join(' ')}…`;
}

/** @param {string} text @param {number} maxWords @param {number} [maxSentences] */
export function polishStatement(text, maxWords, maxSentences = 2) {
  let refined = String(text ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\bI aspire to build a successful financial services venture centered on\b/gi, 'I aim to build a venture focused on')
    .replace(/\bhelping individuals and families achieve financial security\b/gi, 'helping families build financial security')
    .replace(/\bwhile creating opportunities for future leaders and entrepreneurs\b/gi, 'and developing future leaders')
    .replace(/\bMy purpose is to help individuals and families make better financial decisions, driven by\b/gi, 'I guide families in financial decisions, driven by')
    .replace(/\bI want to create opportunities that improve lives and strengthen communities\.?\s*/gi, '')
    .trim();

  const sentences = refined.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, maxSentences);
  refined = sentences.join(' ');
  refined = capStatementWords(refined, maxWords);
  if (refined.endsWith('…') && !refined.endsWith('….') && !refined.endsWith('…!')) {
    refined = `${refined.slice(0, -1)}.`;
  } else if (refined && !/[.!?]$/.test(refined)) {
    refined = `${refined}.`;
  }
  return refined;
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

/** @param {Record<string, string>} followUp */
function ambitionApproachPhrase(followUp) {
  const parts = [];
  if (followUp.entrepreneurship) {
    const map = {
      build_business: 'building a business',
      build_practice: 'building a professional practice',
      lead_team: 'leading a team',
      not_sure: 'exploring my venture path',
    };
    const phrase = map[followUp.entrepreneurship];
    if (phrase) parts.push(phrase);
  }
  if (followUp.leadership) {
    const map = {
      leading_people: 'leading people',
      developing_others: 'developing others',
      creating_impact: 'creating impact',
      building_orgs: 'building organizations',
    };
    const phrase = map[followUp.leadership];
    if (phrase) parts.push(phrase);
  }
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} while ${parts[1]}`;
}

/**
 * @param {Record<string, unknown>} data
 */
export function generateAmbitionDraft(data) {
  const motivators = labelsFor(AMBITION_MOTIVATOR_CARDS, data.selectedMotivators ?? []);
  const focus = formatListNatural(motivators, 3) || 'building a meaningful venture';
  const approach = ambitionApproachPhrase(/** @type {Record<string, string>} */ (data.followUpAnswers ?? {}));

  const draft = approach
    ? `I aim to build a financial services venture focused on ${focus} by ${approach}, helping families build security and opportunity.`
    : `I aim to build a financial services venture focused on ${focus}, helping families build security and developing future leaders.`;

  return polishStatement(draft, MAX_AMBITION_WORDS);
}

/**
 * @param {Record<string, unknown>} data
 */
export function generatePurposeDraft(data) {
  const drivers = labelsFor(PURPOSE_DRIVERS, data.drivers ?? []);
  const driverPhrase = formatListNatural(drivers, 2) || 'service and impact';
  const whyRaw = firstPhrase(String(data.whyDetail ?? ''), 90)
    .replace(/^this matters to me because\s*/i, '')
    .replace(/^because\s*/i, '')
    .trim();

  let draft;
  if (whyRaw) {
    const why = whyRaw.charAt(0).toLowerCase() + whyRaw.slice(1);
    draft = `I guide families toward better financial decisions because ${why}. Driven by ${driverPhrase}, I create lasting impact.`;
  } else {
    draft = `I guide families toward better financial decisions, driven by ${driverPhrase} to create lasting impact.`;
  }

  return polishStatement(draft, MAX_PURPOSE_WORDS);
}

/**
 * Compact purpose statement from legacy prompt answers.
 * @param {Record<string, string>} answers
 */
export function composePurposeFromPrompts(answers) {
  const why = firstPhrase(answers.whyImportant, 80)
    .replace(/^this matters to me because\s*/i, '')
    .replace(/^because\s*/i, '')
    .trim();
  const who = firstPhrase(answers.whoImpact, 40).replace(/[.!?]+$/, '').trim();
  const audience = who || 'families and my community';

  let draft;
  if (why) {
    const reason = why.charAt(0).toLowerCase() + why.slice(1);
    draft = `I guide ${audience.toLowerCase()} in financial decisions because ${reason}.`;
  } else {
    draft = `I guide ${audience.toLowerCase()} in financial decisions to create meaningful, lasting impact.`;
  }

  return polishStatement(draft, MAX_PURPOSE_WORDS, 2);
}

/**
 * Compact ambition from card selections (legacy Day 1 builder).
 * @param {string[]} selectedIds
 * @param {Array<{ id: string, label: string }>} options
 * @param {string} [pathPreference]
 */
export function composeAmbitionFromCards(selectedIds, options, pathPreference) {
  const labels = selectedIds.map((id) => options.find((c) => c.id === id)?.label).filter(Boolean);
  if (!labels.length) return '';

  const focus = formatListNatural(labels, 3);
  const trackHint =
    pathPreference === 'agency_builder'
      ? 'leading a productive team serving families at scale'
      : pathPreference === 'specialist_consultant'
        ? 'becoming a trusted advisor in my chosen niche'
        : '';

  const draft = trackHint
    ? `I aim to build a venture focused on ${focus} — ${trackHint}.`
    : `I aim to build a venture focused on ${focus}, helping families build security and opportunity.`;

  return polishStatement(draft, MAX_AMBITION_WORDS);
}

/**
 * @param {string[]} topFive
 */
export function generateValuesProfile(topFive) {
  const names = labelsFor(COACH_VALUE_CARDS, topFive);
  if (names.length < 5) return '';
  const core = formatListNatural(names, 3);
  const tail = `${names[3].toLowerCase()} and ${names[4].toLowerCase()}`;
  return polishStatement(
    `You are guided by ${core}, plus ${tail}. You thrive where you can grow, serve, and create impact.`,
    55,
    2,
  );
}

/**
 * @param {Record<string, unknown>} data
 */
export function generateFutureSelfNarrative(data) {
  const goals = labelsFor(FUTURE_SELF_GOALS, data.goals ?? []);
  const income = INCOME_SLIDER_LABELS.find((l) => l.value === data.incomeLevel)?.label ?? 'sustainable income';
  const impact = firstPhrase(String(data.impact ?? 'helping families achieve financial security'), 100);
  const success = firstPhrase(String(data.successVision ?? 'leading with confidence and integrity'), 100);
  const goalLine = formatListNatural(goals, 2) || 'building my venture';

  const draft = [
    `In three years, I am a venture builder making measurable progress on ${goalLine}.`,
    `I earn at a ${income.toLowerCase()} level, creating impact through ${impact.replace(/[.!?]+$/, '').toLowerCase()}.`,
    `Success looks like ${success.replace(/[.!?]+$/, '').toLowerCase()}.`,
  ].join(' ');

  return polishStatement(draft, 95, 3);
}

/** @param {string} text @param {string} mode */
export function refineText(text, mode) {
  const base = String(text ?? '').trim();
  if (!base) return base;
  switch (mode) {
    case 'ambitious':
      return polishStatement(`${base} I am committed to bold action and lasting impact.`, MAX_AMBITION_WORDS + 8);
    case 'personal':
      return polishStatement(
        base.replace(/\bI aim\b/i, 'I personally aim').replace(/\bMy purpose\b/i, 'For me, purpose means'),
        MAX_PURPOSE_WORDS + 5,
      );
    case 'professional':
      return polishStatement(`${base} I pursue this with discipline and professional excellence.`, MAX_AMBITION_WORDS + 6);
    case 'shorten':
      return polishStatement(base, Math.min(MAX_AMBITION_WORDS, MAX_PURPOSE_WORDS), 1);
    case 'expand':
      return polishStatement(`${base} This guides my daily priorities and standards.`, MAX_AMBITION_WORDS + 12);
    case 'rewrite': {
      const sentences = base.split(/(?<=[.!?])\s+/).filter(Boolean);
      return polishStatement(sentences.reverse().join(' '), MAX_AMBITION_WORDS + 5);
    }
    case 'realistic':
      return polishStatement(
        base.replace(/bold action/gi, 'consistent action').replace(/at scale/gi, 'over time'),
        MAX_AMBITION_WORDS,
      );
    case 'inspirational':
      return polishStatement(`${base} This future is worth building — and I am ready to do the work.`, MAX_AMBITION_WORDS + 8);
    case 'longer':
      return polishStatement(`${base} Each milestone builds confidence in this path.`, 70, 3);
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
