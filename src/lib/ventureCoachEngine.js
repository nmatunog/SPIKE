/**
 * AI Venture Coach™ — guided draft generation and refinement (local coach engine).
 */
import {
  AMBITION_MOTIVATOR_CARDS,
  COACH_VALUE_CARDS,
  FUTURE_SELF_GOALS,
  INCOME_SLIDER_LABELS,
  IMPACT_AUDIENCES,
  WORD_LIMITS,
} from './ventureCoachConstants.js';

const MAX_AMBITION_WORDS = WORD_LIMITS.ambition.max;
const MAX_IMPACT_WORDS = WORD_LIMITS.impact.max;
/** @deprecated */ const MAX_PURPOSE_WORDS = MAX_IMPACT_WORDS;
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

const DRAFT_STOP_WORDS = new Set([
  'about',
  'after',
  'because',
  'become',
  'being',
  'build',
  'career',
  'create',
  'deeply',
  'financial',
  'future',
  'help',
  'helping',
  'into',
  'make',
  'more',
  'others',
  'personal',
  'reflects',
  'serve',
  'that',
  'this',
  'through',
  'want',
  'what',
  'while',
  'with',
  'work',
  'your',
]);

/**
 * Pull reusable meaning from the participant's draft — not canned SPIKE phrases.
 * @param {string} text
 */
function extractDraftSignals(text) {
  const cleaned = stripCorporateLanguage(text);
  const sentence = firstPhrase(cleaned, 220).replace(/[.!?]+$/, '').trim();

  let lead = 'neutral';
  if (/^I want to/i.test(sentence)) lead = 'i_want';
  else if (/^I am|^I'm/i.test(sentence)) lead = 'i_am';
  else if (/^Become/i.test(sentence)) lead = 'become';
  else if (/^Help/i.test(sentence)) lead = 'help';
  else if (/^(Create|Build|Develop|Serve|Champion|Inspire|Lead|My goal is to)/i.test(sentence)) lead = 'action';

  let audience = '';
  const audienceMatch =
    sentence.match(/\b(?:help|serve|support|guide|champion|develop)\s+([^.—,;]+?)(?:\s+(?:achieve|make|build|to|with)|$)/i)
    || sentence.match(/\bfor\s+([^.—,;]+)/i);
  if (audienceMatch) {
    audience = audienceMatch[1].trim().replace(/\b(to|who|that)\b.*$/i, '').trim();
  }

  let role = '';
  const becomeMatch = sentence.match(/\b(?:become|be)\s+(?:a|an|the)?\s*([^.—,;]+)/i);
  if (becomeMatch) {
    role = becomeMatch[1].trim().replace(/\s+who\s+.*/i, '').trim();
  }

  const distinctive = [
    ...new Set(
      sentence
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length >= 4 && !DRAFT_STOP_WORDS.has(word)),
    ),
  ].slice(0, 4);

  const coreClause = sentence
    .replace(/^I want to\s+/i, '')
    .replace(/^My goal is to\s+/i, '')
    .replace(/^Become\s+/i, '')
    .replace(/^Help\s+/i, 'help ')
    .trim();

  return { cleaned, sentence, lead, audience, role, distinctive, coreClause };
}

/** @param {string[]} words */
function joinNatural(words) {
  if (!words.length) return 'your core idea';
  if (words.length === 1) return words[0];
  if (words.length === 2) return `${words[0]} and ${words[1]}`;
  return `${words.slice(0, -1).join(', ')}, and ${words[words.length - 1]}`;
}

/** @param {string} source @param {string} phrase */
function phraseFromSource(source, phrase) {
  if (!phrase) return phrase;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(escaped, 'i'));
  return match?.[0] ?? phrase;
}

/** @param {string} role */
function withArticle(role) {
  const trimmed = String(role ?? '').trim();
  if (!trimmed) return 'a leader';
  if (/^(a|an|the)\s+/i.test(trimmed)) return trimmed;
  if (/^[aeiou]/i.test(trimmed) && !/^(uni|one|u[bcdefgjkpqstvwxyz])/i.test(trimmed)) {
    return `an ${trimmed}`;
  }
  return `a ${trimmed}`;
}

/** @param {string} mode @param {string} before @param {string} after @param {ReturnType<typeof extractDraftSignals>} signals */
function buildRefineNote(mode, before, after, signals) {
  const anchor = joinNatural(signals.distinctive);
  if (normalizeWhitespace(before) === normalizeWhitespace(after)) {
    return 'This already reads clearly — I kept your wording and only tightened the format.';
  }

  const notes = {
    simplify: `I shortened the sentence but kept your focus on ${anchor}.`,
    core: `I distilled this to one idea centered on ${anchor}.`,
    ambitious: `I kept ${anchor} and expanded the scale of your statement.`,
    personal: `I shifted this into your voice while keeping ${anchor} front and center.`,
    professional: `I elevated the tone without changing what you said about ${anchor}.`,
    inspirational: `I made the tone more outward-facing while preserving ${anchor}.`,
    rewrite: `I reordered your words — the core idea about ${anchor} stays the same.`,
    realistic: `I grounded the language while keeping ${anchor} intact.`,
  };

  return notes[mode] ?? `I reworked the structure while keeping ${anchor} in your statement.`;
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
  let result = removeRedundantClauses(stripCorporateLanguage(text));

  while (countWords(result) > targetWords + 2) {
    if (/\s+[—–-]\s+/.test(result)) {
      result = result.split(/\s+[—–-]\s+/)[0].trim();
      continue;
    }
    if (/\s+while\s+/i.test(result)) {
      result = result.split(/\s+while\s+/i)[0].trim();
      continue;
    }
    if (/\s+and\s+/i.test(result) && countWords(result) > targetWords) {
      result = result.split(/\s+and\s+/i)[0].trim();
      continue;
    }
    const words = result.split(/\s+/).filter(Boolean);
    if (words.length <= targetWords) break;
    result = words.slice(0, targetWords).join(' ');
    break;
  }

  if (countWords(result) > targetWords + 4) {
    const sentences = result.split(/(?<=[.!?])\s+/).filter(Boolean);
    result = sentences[0] ?? result;
  }

  return normalizeWhitespace(result);
}

/** @param {string} text @param {'ambition' | 'impact' | 'purpose' | 'tagline'} statementType */
function distillCoreClause(text, statementType) {
  const signals = extractDraftSignals(text);

  if (statementType === 'impact' || statementType === 'purpose') {
    if (signals.audience) {
      return `Help ${signals.audience.replace(/^(the|a|an)\s+/i, '')}.`;
    }
    if (/^Help/i.test(signals.sentence)) {
      return `${signals.sentence.split(/\s+while\s+/i)[0].replace(/[.!?]+$/, '')}.`;
    }
  }

  if (statementType === 'ambition') {
    if (signals.role) {
      return `Become ${withArticle(signals.role)}.`;
    }
    if (signals.lead === 'become') {
      return `${signals.sentence.split(/\s+who\s+/i)[0].replace(/[.!?]+$/, '')}.`;
    }
    if (signals.lead === 'i_want') {
      return `${signals.sentence.replace(/[.!?]+$/, '')}.`;
    }
  }

  if (statementType === 'tagline') {
    const words = signals.sentence.replace(/[.!?]+$/, '').split(/\s+/).slice(0, 4);
    return `${words.join(' ')}.`;
  }

  return `${firstPhrase(text, 72).replace(/[.!?]+$/, '')}.`;
}

/**
 * Semantic compression — preserves intent while increasing clarity.
 * @param {string} text
 * @param {'ambition' | 'impact' | 'purpose' | 'tagline'} statementType
 */
function resolveStatementLimits(statementType) {
  if (statementType === 'purpose' || statementType === 'impact') return WORD_LIMITS.impact;
  if (statementType === 'tagline') return WORD_LIMITS.tagline;
  return WORD_LIMITS.ambition;
}

/**
 * Semantic compression — preserves intent while increasing clarity.
 * @param {string} text
 * @param {'ambition' | 'impact' | 'purpose' | 'tagline'} statementType
 */
export function simplifyStatement(text, statementType = 'ambition') {
  const limits = resolveStatementLimits(statementType);
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
 * @param {'ambition' | 'impact' | 'purpose' | 'tagline'} statementType
 */
function findCoreIdeaStatement(text, maxWords, statementType = 'ambition') {
  const cleaned = stripCorporateLanguage(text);
  const limits = resolveStatementLimits(statementType);
  let result = distillCoreClause(cleaned, statementType);

  if (statementType === 'tagline') {
    return capStatementWords(result, limits.max);
  }

  result = result.split(/\s+(while|and|—|,)\s+/i)[0].trim();
  if (!/[.!?]$/.test(result)) result = `${result}.`;

  const coreCap = Math.min(maxWords, limits.targetMin ?? Math.floor(limits.max * 0.5) + 4);
  return polishStatement(result, coreCap, 1);
}

/** @param {string} text @param {number} maxWords */
function personalizeStatement(text, maxWords) {
  const signals = extractDraftSignals(text);
  let result;

  if (signals.lead === 'i_want' || signals.lead === 'i_am') {
    const anchor = signals.distinctive[0] ?? 'this work';
    result = `${signals.sentence.replace(/[.!?]+$/, '')} — because ${anchor} matters deeply to me.`;
  } else if (signals.lead === 'become' && signals.role) {
    result = `I want to become ${withArticle(signals.role)}.`;
  } else if (signals.lead === 'help' || signals.audience) {
    const who =
      (signals.audience ? phraseFromSource(signals.cleaned, signals.audience) : null)
      || signals.coreClause.replace(/^help\s+/i, '')
      || 'the people I care about most';
    result = `I want to build a career centered on helping ${who}.`;
  } else if (/^Inspire|^Create|^Build|^Lead|^Champion|^Develop|^Serve/i.test(signals.sentence)) {
    const rest = signals.sentence.replace(
      /^(Inspire others to|Create|Build|Lead with purpose and|Champion|Develop|Serve)\s+/i,
      '',
    );
    result = `I want to ${rest.charAt(0).toLowerCase()}${rest.slice(1).replace(/[.!?]+$/, '')} — because this reflects who I am becoming.`;
  } else if (signals.coreClause) {
    result = `I want to ${signals.coreClause.charAt(0).toLowerCase()}${signals.coreClause.slice(1).replace(/[.!?]+$/, '')} — this is personal to me.`;
  } else {
    result = `I want a career path shaped by ${joinNatural(signals.distinctive)}.`;
  }

  return polishStatement(result, maxWords, 2);
}

/** @param {string} text @param {number} maxWords */
function thinkBiggerStatement(text, maxWords) {
  const signals = extractDraftSignals(text);
  let result = signals.sentence;

  if (/at a scale|lasting community impact|hundreds of|high-impact|scalable|across my (organization|market|community)/i.test(result)) {
    return polishStatement(result, maxWords, 2);
  }

  if (signals.lead === 'help' || signals.audience) {
    const who = signals.audience || 'the people I serve';
    result = `${result.replace(/[.!?]+$/, '')} — reaching many more ${who.toLowerCase()} over time.`;
  } else if (signals.lead === 'become' || signals.role) {
    result = `${result.replace(/[.!?]+$/, '')} — at a scale that multiplies impact across my organization.`;
  } else if (/^I want to/i.test(result)) {
    result = `${result.replace(/[.!?]+$/, '')} — and expand that impact well beyond where I am today.`;
  } else {
    result = `${result.replace(/[.!?]+$/, '')} — at a scale that creates lasting community impact.`;
  }

  return polishStatement(result, maxWords, 2);
}

/** @param {string} text @param {number} maxWords */
function professionalizeStatement(text, maxWords) {
  let result = stripCorporateLanguage(text)
    .replace(/\bI want to\b/gi, 'I am committed to')
    .replace(/\bhelp\b/gi, 'serve')
    .replace(/\bbuild a career\b/gi, 'build a professional practice')
    .replace(/\bgrow into\b/gi, 'develop into')
    .replace(/\bCreate opportunities\b/g, 'Deliver value through opportunities');

  if (!/^[A-Z]/.test(result)) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return polishStatement(result, maxWords, 2);
}

/** @param {string} text @param {number} maxWords */
function inspireOthersStatement(text, maxWords) {
  const signals = extractDraftSignals(text);

  if (/^Inspire others|^Champion .+ so they|^Create opportunities for/i.test(signals.sentence)) {
    return polishStatement(signals.sentence, maxWords, 2);
  }

  let result;
  if (signals.lead === 'become' && signals.role) {
    result = `Inspire others by becoming ${withArticle(signals.role)} who lifts people up.`;
  } else if (signals.audience) {
    result = `Champion ${phraseFromSource(signals.cleaned, signals.audience)} so they can reach bolder financial futures.`;
  } else if (signals.lead === 'i_want' && signals.coreClause) {
    result = `Inspire others to ${signals.coreClause.replace(/[.!?]+$/, '')} — and show them what is possible.`;
  } else if (signals.lead === 'help') {
    result = `${signals.sentence.replace(/^Help/i, 'Champion')} — and invite others to do the same.`;
  } else {
    result = `Inspire others through ${joinNatural(signals.distinctive)} — starting with ${firstPhrase(signals.sentence, 48).replace(/[.!?]+$/, '').toLowerCase()}.`;
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
    const signals = extractDraftSignals(text);
    result = personalizeStatement(signals.sentence || text, maxWords);
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
    .replace(/\bhelping individuals and families achieve financial security\b/gi, 'helping families achieve financial security')
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
  const ids = ranked.slice(0, 3);
  const labels = labelsFor(AMBITION_MOTIVATOR_CARDS, ids);
  const primary = ids[0] ?? 'leadership';
  const secondary = ids[1] ?? '';

  const agencyIds = new Set(['leadership', 'building_team', 'entrepreneurship', 'business_ownership', 'recognition']);
  const specialistIds = new Set(['professional_expertise', 'financial_freedom', 'independence', 'personal_growth']);

  let short;
  let balanced;
  let inspirational;

  if (agencyIds.has(primary) || agencyIds.has(secondary)) {
    short = 'Become a respected leader who builds high-performing teams.';
    balanced = 'Become a respected Agency Director who develops leaders and builds a thriving organization.';
    inspirational = 'Become an influential leader who inspires teams to achieve extraordinary results.';
  } else if (specialistIds.has(primary) || specialistIds.has(secondary)) {
    short = 'Become a trusted advisor in my chosen niche.';
    balanced = 'Become the trusted financial advisor for professionals in my chosen niche.';
    inspirational = 'Become the go-to expert professionals trust for confident financial decisions.';
  } else {
    const focus = formatListNatural(labels, 2) || 'leadership and growth';
    short = polishStatement(`Become a venture builder focused on ${focus}.`, 15, 1);
    balanced = polishStatement(
      `Become a respected professional known for ${focus} and lasting success.`,
      MAX_AMBITION_WORDS,
      1,
    );
    inspirational = polishStatement(
      `Become an influential leader who embodies ${formatListNatural(labels, 3) || focus}.`,
      MAX_AMBITION_WORDS,
      1,
    );
  }

  return { short, balanced, inspirational };
}

/**
 * @param {Record<string, unknown>} data
 */
export function generateAmbitionDraft(data) {
  return generateAmbitionVariants(data).balanced;
}

const IMPACT_TEMPLATES = {
  families: 'Help Filipino families achieve financial security and peace of mind.',
  my_family: 'Help my family build financial security and a stronger future.',
  young_professionals: 'Help young professionals make confident financial decisions early in their careers.',
  entrepreneurs: 'Create opportunities for aspiring entrepreneurs to build meaningful careers.',
  students: 'Help students build financial confidence and prepare for responsible adulthood.',
  ofws: 'Help OFW families achieve financial security across distance and life transitions.',
  business_owners: 'Help business owners make disciplined financial decisions that protect their ventures.',
  healthcare_professionals: 'Help healthcare professionals make confident financial decisions.',
  communities: 'Strengthen communities through accessible financial guidance and opportunity.',
  future_leaders: 'Develop future leaders who create lasting impact in financial services.',
};

/**
 * @param {Record<string, unknown>} data
 */
export function generateImpactDraft(data) {
  const audiences = /** @type {string[]} */ (data.audiences ?? data.drivers ?? []).slice(0, 2);
  const primary = audiences[0];
  const secondary = audiences[1];

  if (primary && IMPACT_TEMPLATES[primary]) {
    if (secondary && IMPACT_TEMPLATES[secondary] && secondary !== primary) {
      const primaryLabel = IMPACT_AUDIENCES.find((item) => item.id === primary)?.label ?? 'others';
      const secondaryLabel = IMPACT_AUDIENCES.find((item) => item.id === secondary)?.label ?? 'communities';
      return polishStatement(
        `Serve ${primaryLabel.toLowerCase()} and ${secondaryLabel.toLowerCase()} with meaningful financial guidance.`,
        MAX_IMPACT_WORDS,
        1,
      );
    }
    return polishStatement(IMPACT_TEMPLATES[primary], MAX_IMPACT_WORDS, 1);
  }

  return polishStatement('Help others achieve financial security and peace of mind.', MAX_IMPACT_WORDS, 1);
}

/**
 * Editable keyword slots extracted from the current draft.
 * @param {string} draft
 * @param {'ambition' | 'impact' | 'purpose' | 'tagline'} statementType
 * @returns {Array<{ id: string, label: string, placeholder: string, value: string }>}
 */
export function extractCustomizationFields(draft, statementType) {
  const signals = extractDraftSignals(draft);

  if (statementType === 'impact' || statementType === 'purpose') {
    let outcome = '';
    const outcomeMatch = String(draft ?? '').match(
      /\b(?:achieve|make|build|create|reach|experience|prepare for)\s+([^.—,;]+)/i,
    );
    if (outcomeMatch) {
      outcome = outcomeMatch[1].trim();
    } else if (signals.distinctive.length) {
      outcome = joinNatural(signals.distinctive.slice(0, 2));
    }

    const audience =
      (signals.audience ? phraseFromSource(signals.cleaned, signals.audience) : '')
      || signals.audience
      || 'Filipino families';

    return [
      {
        id: 'audience',
        label: 'Who you help',
        placeholder: 'Filipino families',
        value: audience,
      },
      {
        id: 'outcome',
        label: 'Difference you create',
        placeholder: 'financial security and peace of mind',
        value: outcome || 'financial security and peace of mind',
      },
    ];
  }

  if (statementType === 'tagline') {
    const cleaned = String(draft ?? '').replace(/[.!?]+$/, '').trim();
    const segments = cleaned.split(/\.\s+/).filter(Boolean);
    return [
      { id: 'word1', label: 'First beat', placeholder: 'Building Leaders', value: segments[0] ?? 'Building Leaders' },
      { id: 'word2', label: 'Second beat', placeholder: 'Creating Opportunities', value: segments[1] ?? 'Creating Opportunities' },
      { id: 'word3', label: 'Third beat (optional)', placeholder: 'Grow. Serve. Lead.', value: segments[2] ?? '' },
    ];
  }

  let role = signals.role ? phraseFromSource(signals.cleaned, signals.role) : 'respected leader';
  let contribution = '';
  let mark = '';

  const whoMatch = String(draft ?? '').match(/\bwho\s+([^.—,;]+?)(?:\s+and\s+|$)/i);
  if (whoMatch) {
    contribution = whoMatch[1].trim();
  }

  const andMatch = String(draft ?? '').match(/\band\s+(builds|creates|develops|leads)\s+([^.—,;]+)/i);
  if (andMatch) {
    mark = `${andMatch[1]} ${andMatch[2]}`.trim();
  }

  if (!contribution && signals.distinctive[0]) {
    contribution = `develops ${signals.distinctive[0]}`;
  }
  if (!mark && signals.distinctive[1]) {
    mark = `builds ${signals.distinctive[1]}`;
  }

  return [
    { id: 'role', label: 'Role you want', placeholder: 'Agency Director', value: role },
    {
      id: 'contribution',
      label: 'What you will do',
      placeholder: 'develops leaders',
      value: contribution || 'develops leaders',
    },
    {
      id: 'mark',
      label: 'What you will build',
      placeholder: 'a thriving organization',
      value: mark || 'a thriving organization',
    },
  ];
}

/** @param {string} phrase */
function normalizeContribution(phrase) {
  return String(phrase ?? '')
    .trim()
    .replace(/^who\s+/i, '')
    .replace(/[.!?]+$/, '');
}

/**
 * Rebuild a statement from edited keyword fields.
 * @param {{
 *   statementType: 'ambition' | 'impact' | 'purpose' | 'tagline',
 *   variant?: 'short' | 'balanced' | 'inspirational',
 *   fields?: Record<string, string>,
 * }} options
 */
export function regenerateFromCustomization({ statementType, variant = 'balanced', fields = {} }) {
  if (statementType === 'ambition') {
    const role = String(fields.role ?? '').trim() || 'respected leader';
    const contribution = normalizeContribution(fields.contribution);
    const mark = String(fields.mark ?? '').trim().replace(/[.!?]+$/, '');

    const short = polishStatement(`Become ${withArticle(role)}.`, 15, 1);
    const balanced = polishStatement(
      contribution && mark
        ? `Become ${withArticle(role)} who ${contribution} and ${mark}.`
        : contribution
          ? `Become ${withArticle(role)} who ${contribution}.`
          : `Become ${withArticle(role)}.`,
      MAX_AMBITION_WORDS,
      1,
    );
    const inspirational = polishStatement(
      contribution
        ? `Become an influential ${role.replace(/^(a|an|the)\s+/i, '')} who ${contribution}${mark ? ` and ${mark}` : ''}.`
        : `Become an influential ${role.replace(/^(a|an|the)\s+/i, '')} who creates meaningful impact.`,
      MAX_AMBITION_WORDS,
      1,
    );

    const variants = { short, balanced, inspirational };
    const text = variants[variant] ?? variants.balanced;
    const pieces = [role, contribution, mark].filter(Boolean).join(', ');

    return {
      text,
      variants,
      note: `I regenerated your statement using your words: ${pieces}.`,
    };
  }

  if (statementType === 'impact' || statementType === 'purpose') {
    const audience = String(fields.audience ?? '').trim() || 'others';
    let outcome = String(fields.outcome ?? '').trim().replace(/[.!?]+$/, '');
    if (outcome && !/^(achieve|make|build|create|reach|experience|prepare)/i.test(outcome)) {
      outcome = `achieve ${outcome}`;
    }

    const text = polishStatement(
      outcome ? `Help ${audience} ${outcome}.` : `Help ${audience} create meaningful financial progress.`,
      MAX_IMPACT_WORDS,
      1,
    );

    return {
      text,
      note: `I regenerated your impact statement for ${audience}${outcome ? ` — ${outcome}` : ''}.`,
    };
  }

  if (statementType === 'tagline') {
    const parts = [fields.word1, fields.word2, fields.word3].map((part) => String(part ?? '').trim()).filter(Boolean);
    const text = capStatementWords(
      parts.map((part) => part.replace(/[.!?]+$/, '')).join('. ') + (parts.length ? '.' : ''),
      MAX_TAGLINE_WORDS,
    );

    return {
      text,
      note: 'I rebuilt your tagline from the words you chose.',
    };
  }

  return { text: '', note: '' };
}

/** @deprecated Use generateImpactDraft */
export function generatePurposeDraft(data) {
  return generateImpactDraft(data);
}

/**
 * Compact impact statement from legacy prompt answers.
 * @param {Record<string, string>} answers
 */
export function composeImpactFromPrompts(answers) {
  const who = firstPhrase(answers.whoImpact, 60).replace(/[.!?]+$/, '').trim();
  const difference = firstPhrase(answers.difference, 80).replace(/[.!?]+$/, '').trim();
  const audience = who || 'families and my community';

  let draft;
  if (difference) {
    draft = `Help ${audience.toLowerCase()} by ${difference.charAt(0).toLowerCase()}${difference.slice(1)}.`;
  } else {
    draft = `Help ${audience.toLowerCase()} achieve financial security and peace of mind.`;
  }

  return polishStatement(draft, MAX_IMPACT_WORDS, 1);
}

/** @deprecated Use composeImpactFromPrompts */
export function composePurposeFromPrompts(answers) {
  return composeImpactFromPrompts(answers);
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
    ? `Become a venture builder focused on ${focus} — ${trackHint}.`
    : `Become a respected professional focused on ${focus}.`;

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
    `You are guided by ${core}, suggesting a principled approach to leadership and entrepreneurship.`,
    MAX_VALUES_WORDS,
    2,
  );
}

const CONCEPT_STOP_WORDS = new Set([
  'what',
  'want',
  'become',
  'help',
  'build',
  'that',
  'with',
  'through',
  'their',
  'who',
  'will',
  'this',
  'from',
  'have',
  'make',
  'financial',
  'services',
  'others',
  'people',
]);

/** @param {string} text */
function statementConceptTokens(text) {
  return new Set(
    String(text ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !CONCEPT_STOP_WORDS.has(word)),
  );
}

export const AMBITION_IMPACT_OVERLAP_WARNING =
  'Your Ambition and Impact appear too similar. Try focusing your Ambition on yourself and your Impact on the people you want to serve.';

/** @param {string} ambition @param {string} impact */
export function statementsOverlapTooMuch(ambition, impact) {
  const ambitionTokens = statementConceptTokens(ambition);
  const impactTokens = statementConceptTokens(impact);
  if (!ambitionTokens.size || !impactTokens.size) return false;

  let shared = 0;
  for (const token of ambitionTokens) {
    if (impactTokens.has(token)) shared += 1;
  }

  const overlapRatio = shared / Math.min(ambitionTokens.size, impactTokens.size);
  const ambitionServesOthers = /\b(help|serve|famil|communit|others|people|clients)\b/i.test(ambition);
  const impactIsIdentity = /\b(become|leader|director|advisor|entrepreneur|build a career)\b/i.test(impact);

  return overlapRatio > 0.5 || (ambitionServesOthers && !/\bbecome\b/i.test(ambition)) || impactIsIdentity;
}

/**
 * @param {{ ambition?: string, impact?: string, purpose?: string, topThree?: string[] }} data
 */
export function generateTagline(data) {
  const values = labelsFor(COACH_VALUE_CARDS, data.topThree ?? []).slice(0, 3);
  const ambition = String(data.ambition ?? '').toLowerCase();
  const impact = String(data.impact ?? data.purpose ?? '').toLowerCase();

  if (ambition.includes('leader') || ambition.includes('director') || ambition.includes('agency')) {
    return capStatementWords('Building Leaders. Creating Opportunities.', MAX_TAGLINE_WORDS);
  }
  if (ambition.includes('advisor') || ambition.includes('expert') || ambition.includes('niche')) {
    return capStatementWords('Helping Professionals Thrive.', MAX_TAGLINE_WORDS);
  }
  if (values.includes('Growth') && values.includes('Service') && values.includes('Leadership')) {
    return capStatementWords('Grow. Serve. Lead.', MAX_TAGLINE_WORDS);
  }

  const fragments = [];

  if (ambition.includes('freedom') || ambition.includes('wealth') || impact.includes('freedom')) {
    fragments.push('Building Freedom');
  }
  if (impact.includes('help') || impact.includes('famil') || impact.includes('communit') || impact.includes('serve')) {
    fragments.push('Creating Impact');
  }
  if (values.includes('Service') || impact.includes('service')) {
    fragments.push('Serve');
  }
  if (values.includes('Growth')) {
    fragments.push('Grow');
  }
  if (values.includes('Leadership') || ambition.includes('lead')) {
    fragments.push('Lead');
  }
  if (values.includes('Integrity')) {
    fragments.push('Lead With Integrity');
  }

  if (fragments.length >= 2) {
    return capStatementWords(`${fragments[0]}. ${fragments.slice(1, 2).join('. ')}.`, MAX_TAGLINE_WORDS);
  }

  if (values.length >= 2) {
    return capStatementWords(`${values[0]}. ${values[1]}. ${values[2] ?? 'Lead'}.`, MAX_TAGLINE_WORDS);
  }

  if (impact.includes('opportunit') || impact.includes('entrepreneur')) {
    return capStatementWords('Building Leaders. Creating Opportunities.', MAX_TAGLINE_WORDS);
  }

  return capStatementWords('Grow. Serve. Lead.', MAX_TAGLINE_WORDS);
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
    `In three years, I am a venture builder making measurable progress on ${goalLine}. I wake up with clarity about where I am headed and the standards I hold myself to every day. My ambition, impact, and values guide the decisions I make — from how I serve clients to how I develop my skills and network.`,
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

/** @param {string} text @param {string} mode @param {number} [maxWords] @param {'ambition' | 'impact' | 'purpose' | 'tagline' | 'future-self'} [statementType] */
export function refineTextWithFeedback(
  text,
  mode,
  maxWords = MAX_AMBITION_WORDS,
  statementType = 'ambition',
) {
  const base = String(text ?? '').trim();
  if (!base) return { text: base, note: '' };

  const resolvedMode = mode === 'shorten' ? 'simplify' : mode;
  const type = statementType === 'future-self' ? 'ambition' : statementType;
  const simplifyType =
    type === 'tagline' ? 'tagline' : type === 'impact' || type === 'purpose' ? 'impact' : 'ambition';
  const signals = extractDraftSignals(base);
  let result = base;

  switch (resolvedMode) {
    case 'simplify':
      if (statementType === 'future-self') {
        result = simplifyFutureSelfNarrative(base);
        return { text: result, note: 'I tightened your narrative while keeping your story intact.' };
      }
      result = simplifyStatement(base, simplifyType);
      break;
    case 'core':
      result = findCoreIdeaStatement(base, maxWords, simplifyType);
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
      return {
        text: capStatementWords(`${base} Each milestone builds confidence in this path.`, MAX_FUTURE_SELF_WORDS),
        note: 'I added a concrete detail to strengthen your future-self story.',
      };
    default:
      return { text: base, note: '' };
  }

  if (statementType !== 'future-self') {
    result = repairRefinedStatement(result, maxWords);
  }

  return {
    text: result,
    note: buildRefineNote(resolvedMode, base, result, signals),
  };
}

/** @param {string} text @param {string} mode @param {number} [maxWords] @param {'ambition' | 'impact' | 'purpose' | 'tagline' | 'future-self'} [statementType] */
export function refineText(text, mode, maxWords = MAX_AMBITION_WORDS, statementType = 'ambition') {
  return refineTextWithFeedback(text, mode, maxWords, statementType).text;
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
