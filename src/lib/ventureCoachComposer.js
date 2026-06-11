/**
 * Deterministic identity statement composer — curated keywords only, no AI.
 */
import {
  AMBITION_KEYWORD_PHRASES,
  AMBITION_ROLE_ARCHETYPES,
  AMBITION_SENTENCE_PATTERNS,
  AMBITION_TONE_VERB_SWAPS,
  CUSTOM_ROLE_ARCHETYPE_ID,
  FUTURE_SELF_SUMMARY_PATTERNS,
  IMPACT_SENTENCE_PATTERNS,
} from './ventureCoachPhraseBank.js';
import {
  AMBITION_MOTIVATOR_CARDS,
  FUTURE_SELF_GOALS,
  IMPACT_AUDIENCES,
  INCOME_SLIDER_LABELS,
  WORD_LIMITS,
} from './ventureCoachConstants.js';
import { polishStatement } from './ventureCoachEngine.js';
import { readAllCoachProfiles } from './ventureCoachStorage.js';

const MAX_AMBITION_WORDS = WORD_LIMITS.ambition.max;
const MAX_IMPACT_WORDS = WORD_LIMITS.impact.max;
const MAX_FUTURE_SELF_SUMMARY = WORD_LIMITS.futureSelfSummary.max;

/** @param {string} text */
export function normalizeCoachStatement(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** @param {string} seed */
function hashSeed(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * @param {string} primaryId
 * @param {string} tone
 */
function resolvePrimaryVerb(primaryId, tone) {
  const phrases = AMBITION_KEYWORD_PHRASES[primaryId] ?? AMBITION_KEYWORD_PHRASES.leadership;
  const swaps = AMBITION_TONE_VERB_SWAPS[tone] ?? null;
  if (!swaps) return phrases.verb;
  return swaps[primaryId] ?? swaps.default ?? phrases.verb;
}

/**
 * @param {string[]} rankedKeywordIds
 * @param {number} index
 */
function keywordPhraseAt(rankedKeywordIds, index) {
  const id = rankedKeywordIds[index] ?? rankedKeywordIds[0] ?? 'leadership';
  return AMBITION_KEYWORD_PHRASES[id] ?? AMBITION_KEYWORD_PHRASES.leadership;
}

/**
 * @param {string} roleArchetypeId
 * @param {string} [customRolePhrase]
 */
function roleLabelFor(roleArchetypeId, customRolePhrase = '') {
  if (roleArchetypeId === CUSTOM_ROLE_ARCHETYPE_ID) {
    return customRolePhrase.trim() || 'Leader';
  }
  return AMBITION_ROLE_ARCHETYPES.find((role) => role.id === roleArchetypeId)?.label ?? 'Leader';
}

/** @param {string} label */
function roleArticlePhrase(label) {
  const article = /^[aeiou]/i.test(label) ? 'an' : 'a';
  return `${article} ${label}`;
}

/**
 * @param {string} template
 * @param {Record<string, string>} slots
 */
function fillPattern(template, slots) {
  return Object.entries(slots).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

/**
 * @param {{
 *   rankedKeywordIds: string[],
 *   roleArchetypeId: string,
 *   variant?: 'short' | 'balanced' | 'inspirational',
 *   tone?: string,
 *   patternSeed?: number,
 *   participantSeed?: string,
 *   customRolePhrase?: string,
 * }} input
 */
export function composeAmbitionStatement(input) {
  const ranked = input.rankedKeywordIds.slice(0, 3);
  const primary = keywordPhraseAt(ranked, 0);
  const secondary = keywordPhraseAt(ranked, 1);
  const tertiary = keywordPhraseAt(ranked, 2);
  const tone = input.tone ?? 'balanced';
  const variant = input.variant ?? 'balanced';
  const role = roleLabelFor(input.roleArchetypeId, input.customRolePhrase);
  const primaryId = ranked[0] ?? 'leadership';

  const patterns = AMBITION_SENTENCE_PATTERNS[variant] ?? AMBITION_SENTENCE_PATTERNS.balanced;
  const seedKey = `${input.participantSeed ?? 'anon'}:${input.patternSeed ?? 0}:${variant}:${tone}:${ranked.join(',')}:${input.roleArchetypeId}:${input.customRolePhrase ?? ''}`;
  const patternIndex = hashSeed(seedKey) % patterns.length;
  const pattern = patterns[patternIndex];

  const slots = {
    role,
    roleArticle: roleArticlePhrase(role),
    primaryTheme: primary.theme,
    secondaryTheme: secondary.theme,
    tertiaryTheme: tertiary.theme,
    primaryVerb: resolvePrimaryVerb(primaryId, tone),
    primaryOutcome: primary.outcome,
    secondaryOutcome: secondary.outcome,
  };

  const raw = fillPattern(pattern, slots);
  const maxWords =
    variant === 'short' ? 15 : variant === 'inspirational' ? MAX_AMBITION_WORDS : MAX_AMBITION_WORDS;

  return polishStatement(raw, maxWords, 1);
}

/**
 * @param {{
 *   rankedKeywordIds: string[],
 *   roleArchetypeId: string,
 *   tone?: string,
 *   patternSeed?: number,
 *   participantSeed?: string,
 *   customRolePhrase?: string,
 * }} input
 * @returns {{ short: string, balanced: string, inspirational: string }}
 */
export function composeAmbitionVariants(input) {
  return {
    short: composeAmbitionStatement({ ...input, variant: 'short' }),
    balanced: composeAmbitionStatement({ ...input, variant: 'balanced' }),
    inspirational: composeAmbitionStatement({ ...input, variant: 'inspirational' }),
  };
}

/** @param {string} a @param {string} b */
export function statementTokenSimilarity(a, b) {
  const left = new Set(normalizeCoachStatement(a).split(' ').filter(Boolean));
  const right = new Set(normalizeCoachStatement(b).split(' ').filter(Boolean));
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap += 1;
  }
  return overlap / Math.max(left.size, right.size);
}

/**
 * @param {string} sectionId
 * @param {string} text
 * @param {string} excludeParticipantId
 */
export function findCohortStatementConflict(sectionId, text, excludeParticipantId) {
  const normalized = normalizeCoachStatement(text);
  if (!normalized) return null;

  const profiles = readAllCoachProfiles();
  for (const [participantId, profile] of Object.entries(profiles)) {
    if (participantId === excludeParticipantId) continue;
    const section = profile.sections?.[sectionId];
    const rawCandidate =
      sectionId === 'future-self'
        ? section?.data?.futureSelfSummary ?? section?.data?.finalText ?? section?.data?.draft ?? ''
        : section?.data?.finalText ?? section?.data?.draft ?? '';
    const candidate = normalizeCoachStatement(rawCandidate);
    if (!candidate) continue;
    if (candidate === normalized) {
      return { type: 'exact', participantId, similarity: 1 };
    }
    const similarity = statementTokenSimilarity(normalized, candidate);
    if (similarity >= 0.85) {
      return { type: 'similar', participantId, similarity };
    }
  }

  return null;
}

/**
 * @param {string[]} rankedKeywordIds
 * @param {string} roleArchetypeId
 * @param {string} tone
 * @param {string} participantId
 * @param {number} startSeed
 */
export function findUniqueAmbitionDraft(
  rankedKeywordIds,
  roleArchetypeId,
  tone,
  participantId,
  startSeed = 0,
  customRolePhrase = '',
) {
  for (let seed = startSeed; seed < startSeed + 8; seed += 1) {
    const variants = composeAmbitionVariants({
      rankedKeywordIds,
      roleArchetypeId,
      tone,
      patternSeed: seed,
      participantSeed: participantId,
      customRolePhrase,
    });
    const balanced = variants.balanced;
    const conflict = findCohortStatementConflict('ambition', balanced, participantId);
    if (!conflict) {
      return { variants, patternSeed: seed, conflict: null };
    }
    if (conflict.type === 'similar') {
      return { variants, patternSeed: seed, conflict };
    }
  }

  const variants = composeAmbitionVariants({
    rankedKeywordIds,
    roleArchetypeId,
    tone,
    patternSeed: startSeed,
    participantSeed: participantId,
    customRolePhrase,
  });
  return { variants, patternSeed: startSeed, conflict: findCohortStatementConflict('ambition', variants.balanced, participantId) };
}

/** @param {string[]} rankedKeywordIds */
export function ambitionContextLabels(rankedKeywordIds) {
  return rankedKeywordIds
    .map((id) => AMBITION_MOTIVATOR_CARDS.find((card) => card.id === id)?.label)
    .filter(Boolean);
}

/**
 * @param {{
 *   audienceIds: string[],
 *   variant?: 'short' | 'balanced' | 'inspirational',
 *   patternSeed?: number,
 *   participantSeed?: string,
 * }} input
 */
export function composeImpactStatement(input) {
  const ids = input.audienceIds.slice(0, 2);
  const primary = IMPACT_AUDIENCES.find((item) => item.id === ids[0]);
  const secondary = IMPACT_AUDIENCES.find((item) => item.id === ids[1]);
  const variant = input.variant ?? 'balanced';
  const seedKey = `${input.participantSeed ?? 'anon'}:${input.patternSeed ?? 0}:${variant}:${ids.join(',')}`;
  const pattern = IMPACT_SENTENCE_PATTERNS[hashSeed(seedKey) % IMPACT_SENTENCE_PATTERNS.length];
  const slots = {
    primaryAudience: primary?.label.toLowerCase() ?? 'families',
    secondaryAudience: secondary?.label.toLowerCase() ?? 'my community',
    primaryOutcome: 'financial security and peace of mind',
    secondaryTheme: 'lasting opportunity',
  };
  const maxWords = variant === 'short' ? 12 : variant === 'inspirational' ? MAX_IMPACT_WORDS : MAX_IMPACT_WORDS;
  return polishStatement(fillPattern(pattern, slots), maxWords, 1);
}

/** @param {{ audienceIds: string[], patternSeed?: number, participantSeed?: string }} input */
export function composeImpactVariants(input) {
  return {
    short: composeImpactStatement({ ...input, variant: 'short' }),
    balanced: composeImpactStatement({ ...input, variant: 'balanced' }),
    inspirational: composeImpactStatement({ ...input, variant: 'inspirational' }),
  };
}

/** @param {string[]} audienceIds @param {string} participantId @param {number} startSeed */
export function findUniqueImpactDraft(audienceIds, participantId, startSeed = 0) {
  for (let seed = startSeed; seed < startSeed + 8; seed += 1) {
    const variants = composeImpactVariants({
      audienceIds,
      patternSeed: seed,
      participantSeed: participantId,
    });
    const conflict = findCohortStatementConflict('impact', variants.balanced, participantId);
    if (!conflict || conflict.type === 'similar') {
      return { variants, patternSeed: seed, conflict: conflict ?? null };
    }
  }
  const variants = composeImpactVariants({ audienceIds, patternSeed: startSeed, participantSeed: participantId });
  return { variants, patternSeed: startSeed, conflict: findCohortStatementConflict('impact', variants.balanced, participantId) };
}

/** @param {string[]} audienceIds */
export function impactContextLabels(audienceIds) {
  return audienceIds
    .map((id) => IMPACT_AUDIENCES.find((item) => item.id === id)?.label)
    .filter(Boolean);
}

/**
 * @param {{
 *   goals?: string[],
 *   incomeLevel?: number,
 *   impact?: string,
 *   successVision?: string,
 *   patternSeed?: number,
 *   participantSeed?: string,
 * }} input
 */
export function composeFutureSelfSummary(input) {
  const goals = (input.goals ?? [])
    .map((id) => FUTURE_SELF_GOALS.find((goal) => goal.id === id)?.label)
    .filter(Boolean);
  const primaryGoal = goals[0]?.toLowerCase() ?? 'building my venture';
  const income =
    INCOME_SLIDER_LABELS.find((item) => item.value === input.incomeLevel)?.label?.toLowerCase() ??
    'sustainable income';
  const impactSnippet = String(input.impact ?? 'meaningful community impact')
    .trim()
    .replace(/[.!?]+$/, '')
    .toLowerCase();
  const seedKey = `${input.participantSeed ?? 'anon'}:${input.patternSeed ?? 0}:${goals.join(',')}:${income}`;
  const pattern = FUTURE_SELF_SUMMARY_PATTERNS[hashSeed(seedKey) % FUTURE_SELF_SUMMARY_PATTERNS.length];
  const raw = fillPattern(pattern, {
    primaryGoal,
    income,
    impact: impactSnippet || 'meaningful community impact',
  });
  return polishStatement(raw, MAX_FUTURE_SELF_SUMMARY, 1);
}

/** @param {Record<string, unknown>} data @param {string} participantId @param {number} startSeed */
export function findUniqueFutureSelfSummary(data, participantId, startSeed = 0) {
  for (let seed = startSeed; seed < startSeed + 8; seed += 1) {
    const summary = composeFutureSelfSummary({
      goals: /** @type {string[]} */ (data.goals ?? []),
      incomeLevel: Number(data.incomeLevel ?? 3),
      impact: String(data.impact ?? ''),
      successVision: String(data.successVision ?? ''),
      patternSeed: seed,
      participantSeed: participantId,
    });
    const conflict = findCohortStatementConflict('future-self', summary, participantId);
    if (!conflict || conflict.type === 'similar') {
      return { summary, patternSeed: seed, conflict: conflict ?? null };
    }
  }
  const summary = composeFutureSelfSummary({
    goals: /** @type {string[]} */ (data.goals ?? []),
    incomeLevel: Number(data.incomeLevel ?? 3),
    impact: String(data.impact ?? ''),
    successVision: String(data.successVision ?? ''),
    patternSeed: startSeed,
    participantSeed: participantId,
  });
  return {
    summary,
    patternSeed: startSeed,
    conflict: findCohortStatementConflict('future-self', summary, participantId),
  };
}
