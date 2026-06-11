/**
 * Deterministic identity statement composer — curated keywords only, no AI.
 */
import {
  AMBITION_KEYWORD_PHRASES,
  AMBITION_ROLE_ARCHETYPES,
  AMBITION_SENTENCE_PATTERNS,
  AMBITION_TONE_VERB_SWAPS,
} from './ventureCoachPhraseBank.js';
import { AMBITION_MOTIVATOR_CARDS, WORD_LIMITS } from './ventureCoachConstants.js';
import { polishStatement } from './ventureCoachEngine.js';
import { readAllCoachProfiles } from './ventureCoachStorage.js';

const MAX_AMBITION_WORDS = WORD_LIMITS.ambition.max;

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
 */
function roleLabelFor(roleArchetypeId) {
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
 * }} input
 */
export function composeAmbitionStatement(input) {
  const ranked = input.rankedKeywordIds.slice(0, 3);
  const primary = keywordPhraseAt(ranked, 0);
  const secondary = keywordPhraseAt(ranked, 1);
  const tertiary = keywordPhraseAt(ranked, 2);
  const tone = input.tone ?? 'balanced';
  const variant = input.variant ?? 'balanced';
  const role = roleLabelFor(input.roleArchetypeId);
  const primaryId = ranked[0] ?? 'leadership';

  const patterns = AMBITION_SENTENCE_PATTERNS[variant] ?? AMBITION_SENTENCE_PATTERNS.balanced;
  const seedKey = `${input.participantSeed ?? 'anon'}:${input.patternSeed ?? 0}:${variant}:${tone}:${ranked.join(',')}:${input.roleArchetypeId}`;
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
    const candidate = normalizeCoachStatement(section?.data?.finalText ?? section?.data?.draft ?? '');
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
export function findUniqueAmbitionDraft(rankedKeywordIds, roleArchetypeId, tone, participantId, startSeed = 0) {
  for (let seed = startSeed; seed < startSeed + 8; seed += 1) {
    const variants = composeAmbitionVariants({
      rankedKeywordIds,
      roleArchetypeId,
      tone,
      patternSeed: seed,
      participantSeed: participantId,
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
  });
  return { variants, patternSeed: startSeed, conflict: findCohortStatementConflict('ambition', variants.balanced, participantId) };
}

/** @param {string[]} rankedKeywordIds */
export function ambitionContextLabels(rankedKeywordIds) {
  return rankedKeywordIds
    .map((id) => AMBITION_MOTIVATOR_CARDS.find((card) => card.id === id)?.label)
    .filter(Boolean);
}
