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

/** @param {string} text */
function normalizeWhitespace(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

/** @param {string} text */
function stripCorporateLanguage(text) {
  return normalizeWhitespace(text)
    .replace(/^for me,?\s*/i, '')
    .replace(/\bI aspire to build a successful financial services (business|venture)\b/gi, 'Build a financial services business')
    .replace(/\bI aim to build a successful financial services (business|venture)\b/gi, 'Build a financial services business')
    .replace(/\bI aspire to\b/gi, '')
    .replace(/\bI aim to\b/gi, '')
    .replace(/\bsuccessful financial services business\b/gi, 'financial services business')
    .replace(/\bthat helps families achieve financial security\b/gi, 'that helps families thrive')
    .replace(/\bhelping families achieve financial security\b/gi, 'helping families thrive')
    .replace(/\bwhile creating opportunities for future leaders and entrepreneurs\b/gi, 'and creates opportunities for future leaders')
    .replace(/\bwhile creating opportunities for future leaders\b/gi, 'and creates opportunities for future leaders')
    .replace(/\band entrepreneurs\b/gi, '')
    .replace(/\bcomprehensive\b/gi, '')
    .replace(/\bmeaningful, lasting impact\b/gi, 'lasting impact')
    .replace(/\bin order to\b/gi, 'to')
    .replace(/\bdue to the fact that\b/gi, 'because')
    .replace(/\s+,/g, ',')
    .replace(/,\s+and\s+and/gi, ' and')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** @param {string} text */
function removeRedundantClauses(text) {
  let result = text;
  const parts = result.split(/\s+while\s+|\s+and\s+while\s+/i);
  if (parts.length > 2) {
    result = `${parts[0]} while ${parts[parts.length - 1]}`;
  }
  return normalizeWhitespace(result.replace(/\b(and|while)\s+\1\b/gi, '$1'));
}

/** @param {string} text */
function simplifyFutureSelfNarrative(text) {
  let result = stripCorporateLanguage(text);
  const paragraphs = result.split(/\n\n+/).map((p) => removeRedundantClauses(p)).filter(Boolean);
  result = paragraphs.slice(0, Math.max(4, paragraphs.length - 1)).join('\n\n');
  while (countWords(result) > MAX_FUTURE_SELF_WORDS) {
    const parts = result.split(/\n\n+/);
    result = parts.slice(0, -1).join('\n\n');
    if (parts.length <= 3) break;
  }
  while (countWords(result) < MIN_FUTURE_SELF_WORDS) {
    result += ' I stay focused on consistent action, learning, and the standards I set for myself.';
  }
  return capStatementWords(result, MAX_FUTURE_SELF_WORDS);
}

/** @param {string} text @param {number} targetWords */
function compressToTarget(text, targetWords) {
  let result = stripCorporateLanguage(text);
  result = removeRedundantClauses(result);

  const helpsFamilies = /help(s|ing)?\s+families/i.test(result);
  const buildsLeaders = /leader|entrepreneur|opportunit/i.test(result);
  const buildsBusiness = /build(s|ing)?\s+(a\s+)?(financial services\s+)?business/i.test(result);

  if (helpsFamilies && buildsLeaders && countWords(result) > targetWords) {
    result = 'Help families thrive while building future leaders.';
  } else if (helpsFamilies && buildsBusiness && countWords(result) > targetWords) {
    result = 'Build a financial services business that helps families thrive and creates opportunities for future leaders.';
  } else if (helpsFamilies && countWords(result) > targetWords) {
    result = result
      .replace(/Build a financial services business that helps families thrive and creates opportunities for future leaders\.?/i, 'Help families thrive while building future leaders.')
      .replace(/Build a .* business that helps families thrive\.?/i, 'Help families thrive through financial services.');
  }

  if (countWords(result) > targetWords + 4) {
    const sentences = result.split(/(?<=[.!?])\s+/).filter(Boolean);
    result = sentences[0] ?? result;
  }

  return normalizeWhitespace(result);
}

/**
 * Semantic compression — preserves intent while increasing clarity.
 * @param {string} text
 * @param {'ambition' | 'purpose' | 'tagline'} statementType
 */
export function simplifyStatement(text, statementType = 'ambition') {
  const limits = WORD_LIMITS[statementType] ?? WORD_LIMITS.ambition;
  const target = Math.round(((limits.targetMin ?? 10) + (limits.targetMax ?? limits.max)) / 2);

  let result = compressToTarget(text, target);

  if (statementType === 'tagline') {
    result = result
      .replace(/\./g, ' ')
      .replace(/\b(I want to|I aim to|Build a|Create a)\b/gi, '')
      .trim();
    const words = result.split(/\s+/).filter(Boolean);
    if (words.length > limits.targetMax) {
      result = words.slice(0, limits.targetMax).join(' ');
    }
    return capStatementWords(result, limits.max);
  }

  if (countWords(result) > target) {
    result = compressToTarget(result, Math.max(limits.targetMin ?? 8, target - 3));
  }

  return polishStatement(result, limits.max, 1);
}

/**
 * Distill to a single memorable central idea.
 * @param {string} text
 * @param {number} maxWords
 * @param {'ambition' | 'purpose' | 'tagline'} statementType
 */
function findCoreIdeaStatement(text, maxWords, statementType = 'ambition') {
  const cleaned = stripCorporateLanguage(text);
  const limits = WORD_LIMITS[statementType] ?? WORD_LIMITS.ambition;

  /** @type {Array<{ weight: number, idea: string }>} */
  const themes = [];

  if (/famil|thriv|financial security/i.test(cleaned)) {
    themes.push({ weight: 4, idea: 'Help families thrive.' });
  }
  if (/leader|entrepreneur|opportunit/i.test(cleaned)) {
    themes.push({ weight: 3, idea: 'Develop future leaders.' });
  }
  if (/business|venture|financial services/i.test(cleaned)) {
    themes.push({ weight: 3, idea: 'Build a financial services business.' });
  }
  if (/impact|serve|service|community/i.test(cleaned)) {
    themes.push({ weight: 2, idea: 'Create lasting impact.' });
  }
  if (/freedom|wealth|income/i.test(cleaned)) {
    themes.push({ weight: 2, idea: 'Create financial freedom.' });
  }
  if (/grow|learning|expert|professional/i.test(cleaned)) {
    themes.push({ weight: 1, idea: 'Become a trusted expert.' });
  }

  themes.sort((a, b) => b.weight - a.weight);

  let result = themes[0]?.idea ?? firstPhrase(cleaned, 72);

  if (statementType === 'purpose') {
    if (/famil/i.test(cleaned)) result = 'Strengthen families and improve lives.';
    else if (/impact|service/i.test(cleaned)) result = 'Create impact that improves lives.';
    else if (/freedom|security/i.test(cleaned)) result = 'Build security and freedom for others.';
    else result = themes[0]?.idea.replace(/^Build/, 'Enable').replace(/^Help/, 'Serve so families') ?? result;
  }

  if (statementType === 'tagline') {
    if (/famil/i.test(cleaned)) result = 'Helping Families Thrive.';
    else if (/leader|opportunit/i.test(cleaned)) result = 'Building Future Leaders.';
    else if (/freedom|wealth/i.test(cleaned)) result = 'Building Freedom.';
    else if (/impact|service/i.test(cleaned)) result = 'Creating Lasting Impact.';
    else {
      const words = (themes[0]?.idea ?? 'Lead With Purpose.').replace(/[.!?]+$/, '').split(/\s+/).slice(0, 4);
      result = `${words.join(' ')}.`;
    }
    return capStatementWords(result, limits.max);
  }

  result = result.split(/\s+(while|and|—|,)\s+/i)[0].trim();
  if (!/[.!?]$/.test(result)) result = `${result}.`;

  const coreCap = Math.min(maxWords, limits.targetMin ?? Math.floor(limits.max * 0.5) + 4);
  return polishStatement(result, coreCap, 1);
}

/** @param {string} text @param {number} maxWords */
function personalizeStatement(text, maxWords) {
  const cleaned = stripCorporateLanguage(text);
  let result;

  if (/\b(pursue inspire others|I want to pursue inspire)\b/i.test(cleaned)) {
    result =
      'I want to empower others to build brighter financial futures because this work feels deeply personal to me.';
  } else if (/inspire others|brighter financial futures|bold financial futures|empower others/i.test(cleaned)) {
    result =
      'I want to empower others to build brighter financial futures because this work feels deeply personal to me.';
  } else if (/help.*famil|famil.*thriv|financial security/i.test(cleaned)) {
    result =
      'I want to build a career that helps families thrive while creating financial security for my own family.';
  } else if (/leader|entrepreneur|opportunit/i.test(cleaned)) {
    result = 'I want to grow into a leader who creates opportunities for others while building a life my family is proud of.';
  } else if (/business|venture|practice|financial services/i.test(cleaned)) {
    result = 'I want to build a career that reflects what matters most to me and gives my family a stronger future.';
  } else {
    result = 'I want a career path that aligns with my values and the future I am working toward.';
  }

  return polishStatement(result, maxWords, 2);
}

/** @param {string} text @param {number} maxWords */
function thinkBiggerStatement(text, maxWords) {
  let result = stripCorporateLanguage(text);

  if (/at a scale|lasting community impact|hundreds of families|high-impact|scalable business/i.test(result)) {
    return polishStatement(result, maxWords, 2);
  }

  if (/help.*famil|financial security|financially secure/i.test(result) && !/hundreds|many families|at scale/i.test(result)) {
    result = result.replace(/\bhelp(s|ing)? families\b/gi, 'help hundreds of families achieve financial security');
    if (!/build/i.test(result)) {
      result = `Build a business that ${result.charAt(0).toLowerCase()}${result.slice(1)}`;
    }
  } else if (/build.*business|venture/i.test(result)) {
    result = result.replace(/\ba business\b/i, 'a scalable business').replace(/\bBuild a\b/, 'Build a high-impact');
    if (!/leader|impact|community/i.test(result)) {
      result = `${result.replace(/[.!?]+$/, '')} and develop leaders who expand that impact.`;
    }
  } else {
    result = `${result.replace(/[.!?]+$/, '')} — at a scale that creates lasting community impact.`;
  }

  return polishStatement(result, maxWords, 2);
}

/** @param {string} text @param {number} maxWords */
function professionalizeStatement(text, maxWords) {
  let result = stripCorporateLanguage(text)
    .replace(/\bI want to help families make better money decisions\b/gi, 'Provide financial guidance that helps families make informed long-term financial decisions')
    .replace(/\bhelp families thrive\b/gi, 'help families make informed long-term financial decisions')
    .replace(/\bhelp families\b/gi, 'serve families with disciplined financial guidance')
    .replace(/\bbuild a career\b/gi, 'build a professional practice')
    .replace(/\bI want to\b/gi, '')
    .replace(/\bCreate opportunities\b/g, 'Deliver value through opportunities');

  if (!/^[A-Z]/.test(result)) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return polishStatement(result, maxWords, 2);
}

const INSPIRATIONAL_REFINE_OUTPUTS = [
  'Create a business that empowers people to build brighter financial futures.',
  'Champion families so they can build confident, thriving financial lives.',
  'Lead with purpose and unlock opportunities for the next generation of entrepreneurs.',
  'Inspire others to pursue bold financial futures rooted in integrity and service.',
];

/** @param {string} text @param {number} maxWords */
function inspireOthersStatement(text, maxWords) {
  const cleaned = stripCorporateLanguage(text);
  const normalized = cleaned.replace(/[.!?]+$/, '').trim();
  if (INSPIRATIONAL_REFINE_OUTPUTS.some((line) => line.replace(/[.!?]+$/, '') === normalized)) {
    return polishStatement(cleaned, maxWords, 2);
  }

  let result;

  if (/build.*business|financial services|venture/i.test(cleaned)) {
    result = 'Create a business that empowers people to build brighter financial futures.';
  } else if (/help.*famil|serve.*famil/i.test(cleaned)) {
    result = 'Champion families so they can build confident, thriving financial lives.';
  } else if (/leader|entrepreneur/i.test(cleaned)) {
    result = 'Lead with purpose and unlock opportunities for the next generation of entrepreneurs.';
  } else {
    result = 'Inspire others to pursue bold financial futures rooted in integrity and service.';
  }

  return polishStatement(result, maxWords, 2);
}

/** @param {string} text @param {number} maxWords */
function rewriteStatement(text, maxWords) {
  const cleaned = stripCorporateLanguage(text);
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > 1) {
    return polishStatement(sentences.reverse().join(' '), maxWords, 2);
  }

  const clauseSplit = cleaned.split(/\s*[—–-]\s+/);
  if (clauseSplit.length > 1) {
    return polishStatement(`${clauseSplit.slice(1).join(' — ')} — ${clauseSplit[0]}`, maxWords, 1);
  }

  const whileSplit = cleaned.split(/\s+while\s+/i);
  if (whileSplit.length > 1) {
    const tail = whileSplit[1].replace(/[.!?]+$/, '');
    const head = whileSplit[0].replace(/[.!?]+$/, '');
    return polishStatement(
      `While ${tail.charAt(0).toLowerCase()}${tail.slice(1)}, ${head.charAt(0).toLowerCase()}${head.slice(1)}.`,
      maxWords,
      1,
    );
  }

  const verbSwap = cleaned.match(/^(I want to|I aim to|Build|Create|Inspire others to|Lead with purpose and)\s+(.+)$/i);
  if (verbSwap) {
    const rest = verbSwap[2].replace(/[.!?]+$/, '');
    const alt = /^I want to/i.test(verbSwap[1]) ? `My goal is to ${rest}` : `I aim to ${rest}`;
    return polishStatement(alt, maxWords, 1);
  }

  return polishStatement(cleaned, maxWords, 1);
}

/** @param {string} text @param {number} maxWords */
function repairRefinedStatement(text, maxWords) {
  let result = normalizeWhitespace(text);

  if (/\b(pursue inspire others|I want to pursue inspire)\b/i.test(result)) {
    result =
      'I want to empower others to build brighter financial futures because this work feels deeply personal to me.';
  }

  if (countWords(result) > maxWords) {
    result = polishStatement(result, maxWords, 2);
  }

  return result;
}

/**
 * @param {string} text
 * @param {{ max: number, targetMin?: number, targetMax?: number, min?: number }} limits
 */
export function evaluateStatement(text, limits) {
  const normalized = normalizeWhitespace(text);
  const words = countWords(normalized);
  const targetMax = limits.targetMax ?? Math.floor(limits.max * 0.75);

  let clarity = 92;
  if (words > limits.max) clarity -= 22;
  else if (words > targetMax) clarity -= 12;
  if (/\b(utilize|leverage|synergy|paradigm|stakeholder)\b/i.test(normalized)) clarity -= 12;
  if ((normalized.match(/,/g) ?? []).length > 2) clarity -= 8;
  if ((normalized.match(/\band\b/gi) ?? []).length > 2 && words > 14) clarity -= 6;
  if (normalized.length > 140) clarity -= 5;
  clarity = Math.max(45, Math.min(98, clarity));

  let memorability = 88;
  if (words >= (limits.targetMin ?? 8) && words <= (limits.targetMax ?? limits.max)) memorability += 6;
  if (words > targetMax) memorability -= 14;
  if (words > limits.max) memorability -= 22;
  if (words <= 6 && limits.max <= 8) memorability += 8;
  memorability = Math.max(42, Math.min(98, memorability));

  let lengthLabel = 'Excellent';
  if (words > limits.max) lengthLabel = 'Too Long';
  else if (words > targetMax) lengthLabel = 'Long';
  else if (limits.targetMin && words < limits.targetMin) lengthLabel = 'Short';
  else if (words >= (limits.targetMin ?? 0) && words <= (limits.targetMax ?? limits.max)) lengthLabel = 'Excellent';
  else lengthLabel = 'Good';

  const recommendSimplify = words > targetMax;

  return {
    clarity,
    memorability,
    lengthLabel,
    recommendSimplify,
    recommendation: recommendSimplify
      ? {
          message: 'This statement is powerful but may be difficult to remember.',
          action: 'Make Simpler',
          actionId: 'simplify',
        }
      : null,
  };
}

/** @param {string} text @param {number} maxWords */
export function capStatementWords(text, maxWords) {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ').replace(/[,;—–-]+$/, '');
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
  if (refined && !/[.!?]$/.test(refined) && maxSentences <= 2) {
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

/** @param {string} text @param {string} mode @param {number} [maxWords] @param {'ambition' | 'purpose' | 'tagline' | 'future-self'} [statementType] */
export function refineText(text, mode, maxWords = MAX_AMBITION_WORDS, statementType = 'ambition') {
  const base = String(text ?? '').trim();
  if (!base) return base;

  const resolvedMode = mode === 'shorten' ? 'simplify' : mode;
  const type = statementType === 'future-self' ? 'ambition' : statementType;
  let result = base;

  switch (resolvedMode) {
    case 'simplify':
      if (statementType === 'future-self') {
        return simplifyFutureSelfNarrative(base);
      }
      result = simplifyStatement(base, type === 'tagline' ? 'tagline' : type === 'purpose' ? 'purpose' : 'ambition');
      break;
    case 'core':
      result = findCoreIdeaStatement(
        base,
        maxWords,
        type === 'tagline' ? 'tagline' : type === 'purpose' ? 'purpose' : 'ambition',
      );
      break;
    case 'ambitious':
      result = thinkBiggerStatement(base, maxWords);
      break;
    case 'personal':
      result = personalizeStatement(base, maxWords);
      break;
    case 'professional':
      result = professionalizeStatement(base, maxWords);
      break;
    case 'inspirational':
      result = inspireOthersStatement(base, maxWords);
      break;
    case 'rewrite':
      result = rewriteStatement(base, maxWords);
      break;
    case 'realistic':
      result = polishStatement(
        base.replace(/bold/gi, 'consistent').replace(/at scale/gi, 'over time').replace(/hundreds of/gi, ''),
        maxWords,
      );
      break;
    case 'longer':
      return capStatementWords(`${base} Each milestone builds confidence in this path.`, MAX_FUTURE_SELF_WORDS);
    default:
      return base;
  }

  if (statementType === 'future-self') {
    return result;
  }

  return repairRefinedStatement(result, maxWords);
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
