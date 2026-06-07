/**
 * AI Venture Coach™ — guided draft generation and refinement (local coach engine).
 */
import {
  AMBITION_MOTIVATOR_CARDS,
  COACH_VALUE_CARDS,
  FUTURE_SELF_GOALS,
  INCOME_SLIDER_LABELS,
  PURPOSE_DRIVERS,
  WORD_LIMITS,
} from './ventureCoachConstants.js';

const MAX_AMBITION_WORDS = WORD_LIMITS.ambition.max;
const MAX_PURPOSE_WORDS = WORD_LIMITS.purpose.max;
const MAX_VALUES_WORDS = WORD_LIMITS.valuesProfile.max;
const MAX_TAGLINE_WORDS = WORD_LIMITS.tagline.max;
const MAX_FUTURE_SELF_WORDS = WORD_LIMITS.futureSelf.max;
const MIN_FUTURE_SELF_WORDS = WORD_LIMITS.futureSelf.min;
const MAX_FUTURE_SELF_SUMMARY = WORD_LIMITS.futureSelfSummary.max;

/** @param {string} text */
export function countWords(text) {
  return String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * @param {number} count
 * @param {{ max: number, targetMin?: number, targetMax?: number, min?: number }} limits
 */
export function getWordGuidanceStatus(count, limits) {
  if (limits.min && count < limits.min) {
    return { status: 'too-short', label: 'Keep going', message: `Aim for at least ${limits.min} words.` };
  }
  if (count > limits.max) {
    return { status: 'too-long', label: 'Too Long', message: 'Consider simplifying your message.' };
  }
  if (limits.targetMin && limits.targetMax && count >= limits.targetMin && count <= limits.targetMax) {
    return { status: 'excellent', label: 'Excellent Length', message: '' };
  }
  if (limits.targetMin && count < limits.targetMin) {
    return { status: 'short', label: 'Almost there', message: `Target ${limits.targetMin}–${limits.targetMax ?? limits.max} words.` };
  }
  return { status: 'ok', label: 'Good Length', message: '' };
}

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
    .replace(/\bhelping individuals and families achieve financial security\b/gi, 'helping families thrive')
    .replace(/\bwhile creating opportunities for future leaders and entrepreneurs\b/gi, 'and developing future leaders')
    .trim();

  const sentences = refined.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, maxSentences);
  refined = sentences.join(' ');
  refined = capStatementWords(refined, maxWords);
  if (refined.endsWith('…') && !refined.endsWith('….') && !refined.endsWith('…!')) {
    refined = `${refined.slice(0, -1)}.`;
  } else if (refined && !/[.!?]$/.test(refined) && maxSentences <= 2) {
    refined = `${refined}.`;
  }
  return refined;
}

/**
 * @param {Record<string, unknown>} data
 * @returns {{ short: string, balanced: string, inspirational: string }}
 */
export function generateAmbitionVariants(data) {
  const ranked = /** @type {string[]} */ (data.rankedMotivators ?? data.selectedMotivators ?? []);
  const labels = labelsFor(AMBITION_MOTIVATOR_CARDS, ranked);
  const primary = labels[0]?.toLowerCase() ?? 'building my venture';
  const secondary = labels[1]?.toLowerCase() ?? '';
  const tertiary = labels[2]?.toLowerCase() ?? '';

  const short = polishStatement(
    `Build a venture focused on ${primary}, creating freedom and impact.`,
    15,
    1,
  );

  const balanced = polishStatement(
    secondary
      ? `Build a successful financial services business centered on ${primary} and ${secondary}, helping families thrive.`
      : `Build a successful financial services business focused on ${primary}, helping families thrive.`,
    MAX_AMBITION_WORDS,
  );

  const inspirational = polishStatement(
    tertiary
      ? `Become a trusted entrepreneur who leads with ${primary}, ${secondary}, and ${tertiary}.`
      : `Become a trusted financial entrepreneur who creates opportunities and develops future leaders.`,
    MAX_AMBITION_WORDS,
  );

  return { short, balanced, inspirational };
}

/**
 * @param {Record<string, unknown>} data
 */
export function generateAmbitionDraft(data) {
  return generateAmbitionVariants(data).balanced;
}

/**
 * @param {Record<string, unknown>} data
 */
export function generatePurposeDraft(data) {
  const drivers = labelsFor(PURPOSE_DRIVERS, (data.drivers ?? []).slice(0, 2));
  const driverPhrase = formatListNatural(drivers, 2) || 'impact and service';

  const templates = [
    `Create opportunities that improve lives, driven by ${driverPhrase}.`,
    `Use my talents to create impact through ${driverPhrase}.`,
    `Serve families with purpose, guided by ${driverPhrase}.`,
  ];

  return polishStatement(templates[0], MAX_PURPOSE_WORDS, 1);
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
    draft = `Guide ${audience.toLowerCase()} with purpose because ${reason}.`;
  } else {
    draft = `Guide ${audience.toLowerCase()} to create meaningful, lasting impact.`;
  }

  return polishStatement(draft, MAX_PURPOSE_WORDS, 1);
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
    ? `Build a venture focused on ${focus} — ${trackHint}.`
    : `Build a venture focused on ${focus}, helping families thrive.`;

  return polishStatement(draft, MAX_AMBITION_WORDS);
}

/**
 * @param {string[]} topThree
 */
export function generateValuesProfile(topThree) {
  const names = labelsFor(COACH_VALUE_CARDS, topThree.slice(0, 3));
  if (names.length < 3) return '';
  const core = formatListNatural(names, 3);
  return polishStatement(
    `You are motivated by ${core}, suggesting a purpose-driven approach to leadership and entrepreneurship.`,
    MAX_VALUES_WORDS,
    2,
  );
}

/**
 * @param {{ ambition?: string, purpose?: string, topThree?: string[] }} data
 */
export function generateTagline(data) {
  const values = labelsFor(COACH_VALUE_CARDS, data.topThree ?? []).slice(0, 3);
  const ambition = String(data.ambition ?? '').toLowerCase();
  const purpose = String(data.purpose ?? '').toLowerCase();

  const fragments = [];

  if (ambition.includes('freedom') || ambition.includes('wealth') || purpose.includes('freedom')) {
    fragments.push('Building Freedom');
  }
  if (ambition.includes('help') || ambition.includes('famil') || purpose.includes('famil') || purpose.includes('impact')) {
    fragments.push('Creating Impact');
  }
  if (values.includes('Service') || purpose.includes('service')) {
    fragments.push('Serve');
  }
  if (values.includes('Growth')) {
    fragments.push('Grow');
  }
  if (values.includes('Leadership') || ambition.includes('lead')) {
    fragments.push('Lead');
  }
  if (values.includes('Integrity')) {
    fragments.push('Lead With Purpose');
  }

  if (fragments.length >= 2) {
    return capStatementWords(`${fragments[0]}. ${fragments.slice(1, 2).join('. ')}.`, MAX_TAGLINE_WORDS);
  }

  if (values.length >= 2) {
    return capStatementWords(`${values[0]}. ${values[1]}. ${values[2] ?? 'Lead'}.`, MAX_TAGLINE_WORDS);
  }

  if (purpose.includes('opportunit')) {
    return capStatementWords('Building Leaders. Creating Opportunities.', MAX_TAGLINE_WORDS);
  }

  return capStatementWords('Leading With Purpose.', MAX_TAGLINE_WORDS);
}

/**
 * @param {Record<string, unknown>} data
 */
export function generateFutureSelfNarrative(data) {
  const goals = labelsFor(FUTURE_SELF_GOALS, data.goals ?? []);
  const income = INCOME_SLIDER_LABELS.find((l) => l.value === data.incomeLevel)?.label ?? 'sustainable income';
  const impact = firstPhrase(String(data.impact ?? 'helping families achieve financial security'), 120);
  const success = firstPhrase(String(data.successVision ?? 'leading with confidence and integrity'), 120);
  const goalLine = formatListNatural(goals, 3) || 'building my venture';

  const paragraphs = [
    `In three years, I am a venture builder making measurable progress on ${goalLine}. I wake up with clarity about where I am headed and the standards I hold myself to every day. My ambition and purpose guide the decisions I make — from how I serve clients to how I develop my skills and network.`,
    `Financially, I operate at a ${income.toLowerCase()} level. That means my business or practice generates the income I need to support my goals while reinvesting in growth. I track key metrics, manage cash flow deliberately, and make choices that align with long-term freedom — not just short-term wins.`,
    `The impact I create centers on ${impact.replace(/[.!?]+$/, '').toLowerCase()}. I measure success not only by revenue but by the families and professionals whose lives improve because of my work. I stay connected to my values and use them as a filter when opportunities arise.`,
    `When I imagine success, ${success.replace(/[.!?]+$/, '').toLowerCase()}. I have built credibility in my market, earned trust through consistent delivery, and created a reputation for integrity and excellence. People refer others to me because they believe in what I stand for.`,
    `My daily rhythm includes focused client work, deliberate learning, and leadership — whether leading a team, mentoring peers, or modeling the standards I expect from myself. I protect time for family, health, and reflection so I can sustain this path for decades, not just seasons.`,
    `Looking ahead, I see compounding results: stronger relationships, deeper expertise, and a venture that reflects who I am becoming. I am not waiting for permission to lead. I am building the future I declared in my Venture Blueprint — one disciplined step at a time.`,
  ];

  let draft = paragraphs.join('\n\n');
  const padding =
    ' I continue refining my craft, strengthening relationships, and staying accountable to the identity I defined with my coach.';

  while (countWords(draft) < MIN_FUTURE_SELF_WORDS) {
    draft += padding;
  }

  return capStatementWords(draft, MAX_FUTURE_SELF_WORDS);
}

/** @param {string} narrative @param {Record<string, unknown>} [data] */
export function generateFutureSelfSummary(narrative, data = {}) {
  const goals = labelsFor(FUTURE_SELF_GOALS, data.goals ?? []);
  const primary = goals[0]?.toLowerCase() ?? 'my venture';

  const fromNarrative = firstPhrase(narrative, 140);
  if (fromNarrative && countWords(fromNarrative) <= MAX_FUTURE_SELF_SUMMARY) {
    return polishStatement(fromNarrative, MAX_FUTURE_SELF_SUMMARY, 1);
  }

  return polishStatement(
    `A respected financial entrepreneur leading a thriving business focused on ${primary} and creating opportunities for others.`,
    MAX_FUTURE_SELF_SUMMARY,
    1,
  );
}

/** @deprecated Follow-ups removed from PRD v1 — returns empty array */
export function getAmbitionFollowUps() {
  return [];
}

/** @param {string} text @param {string} mode @param {number} [maxWords] */
export function refineText(text, mode, maxWords = MAX_AMBITION_WORDS) {
  const base = String(text ?? '').trim();
  if (!base) return base;
  const shortenTarget = Math.max(6, Math.floor(maxWords * 0.75));

  switch (mode) {
    case 'ambitious':
      return polishStatement(`${base} I pursue bold outcomes with discipline.`, maxWords);
    case 'personal':
      return polishStatement(
        base.replace(/\bI aim\b/i, 'I personally aim').replace(/\bBuild\b/, 'I build'),
        maxWords,
        1,
      );
    case 'professional':
      return polishStatement(`${base} I pursue this with professional excellence.`, maxWords);
    case 'shorten':
      return polishStatement(base, shortenTarget, 1);
    case 'inspirational':
      return polishStatement(`${base} This future is worth building.`, maxWords);
    case 'rewrite': {
      const sentences = base.split(/(?<=[.!?])\s+/).filter(Boolean);
      return polishStatement(sentences.reverse().join(' '), maxWords);
    }
    case 'realistic':
      return polishStatement(
        base.replace(/bold/gi, 'consistent').replace(/at scale/gi, 'over time'),
        maxWords,
      );
    case 'longer':
      return capStatementWords(`${base} Each milestone builds confidence in this path.`, MAX_FUTURE_SELF_WORDS);
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
