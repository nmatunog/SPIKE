/**
 * Trainable local coach — learns phrasing from each intern's accepted drafts and chat replies.
 * Not ML training: a personal lexicon + quality polish layer on top of ventureCoachEngine.
 */
import { parseAmbitionCustomization, regenerateFromCustomization } from './ventureCoachEngine.js';
import { getCoachProfile, patchCoachProfileLexicon } from './ventureCoachStorage.js';

const MAX_LEXICON_ITEMS = 10;

/** @returns {Record<string, Record<string, string[]>>} */
function emptyLexicon() {
  return {
    ambition: { role: [], contribution: [], mark: [], accepted: [] },
    impact: { audience: [], outcome: [], accepted: [] },
    tagline: { word1: [], word2: [], word3: [], accepted: [] },
  };
}

/** @param {string} participantId */
export function getCoachLexicon(participantId) {
  const profile = getCoachProfile(participantId);
  return profile?.coachLexicon ?? emptyLexicon();
}

/** @param {string[]} list @param {string} value */
function pushUnique(list, value) {
  const cleaned = fixCoachPhrase(value);
  if (!cleaned || cleaned.length < 3) return list;
  const next = [cleaned, ...list.filter((item) => item.toLowerCase() !== cleaned.toLowerCase())];
  return next.slice(0, MAX_LEXICON_ITEMS);
}

/**
 * @param {string} participantId
 * @param {'ambition' | 'impact' | 'purpose' | 'tagline'} sectionType
 * @param {{ fields?: Record<string, string>, acceptedText?: string }} payload
 */
export function recordCoachLearning(participantId, sectionType, payload = {}) {
  if (!participantId) return;
  const lexicon = { ...emptyLexicon(), ...getCoachLexicon(participantId) };
  const type = sectionType === 'purpose' ? 'impact' : sectionType;
  const bucket = { ...emptyLexicon()[type], ...lexicon[type] };

  const fields = payload.fields ?? {};
  if (type === 'ambition') {
    bucket.role = pushUnique(bucket.role, fields.role ?? '');
    bucket.contribution = pushUnique(bucket.contribution, fields.contribution ?? '');
    bucket.mark = pushUnique(bucket.mark, fields.mark ?? '');
  } else if (type === 'impact') {
    bucket.audience = pushUnique(bucket.audience, fields.audience ?? '');
    bucket.outcome = pushUnique(bucket.outcome, fields.outcome ?? '');
  } else if (type === 'tagline') {
    bucket.word1 = pushUnique(bucket.word1, fields.word1 ?? '');
    bucket.word2 = pushUnique(bucket.word2, fields.word2 ?? '');
    bucket.word3 = pushUnique(bucket.word3, fields.word3 ?? '');
  }

  if (payload.acceptedText) {
    bucket.accepted = pushUnique(bucket.accepted, payload.acceptedText);
    if (type === 'ambition') {
      const parsed = parseAmbitionCustomization(payload.acceptedText);
      if (parsed.role) bucket.role = pushUnique(bucket.role, parsed.role);
      if (parsed.contribution) bucket.contribution = pushUnique(bucket.contribution, parsed.contribution);
      if (parsed.mark) bucket.mark = pushUnique(bucket.mark, parsed.mark);
    }
  }

  patchCoachProfileLexicon(participantId, { ...lexicon, [type]: bucket });
}

/** @param {string} raw */
export function fixCoachPhrase(raw) {
  let text = String(raw ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^n\s+(?=influ)/i, 'an influ')
    .replace(/\bteh\b/gi, 'the')
    .replace(/\brecieve\b/gi, 'receive')
    .replace(/\bacheive\b/gi, 'achieve')
    .replace(/\bfinacial\b/gi, 'financial')
    .replace(/\borganizaton\b/gi, 'organization')
    .replace(/\b(a|an)\s+(a|an)\s+/gi, '$1 ')
    .replace(/\binfluential\s+influential\b/gi, 'influential')
    .replace(/\bleader\s+leader\b/gi, 'leader')
    .replace(/\b(develops|builds|creates)\s+\1\b/gi, '$1');

  return text.trim();
}

/** @param {string} text */
function removeAdjacentDuplicateWords(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const out = [];
  for (const word of words) {
    const prev = out[out.length - 1];
    if (prev && prev.toLowerCase() === word.toLowerCase()) continue;
    out.push(word);
  }
  return out.join(' ');
}

/** @param {string} text @param {'ambition' | 'impact' | 'purpose' | 'tagline' | 'future-self'} [statementType] */
export function polishCoachStatement(text, statementType = 'ambition') {
  let result = fixCoachPhrase(text);
  result = removeAdjacentDuplicateWords(result);

  if (statementType === 'ambition' || statementType === 'impact' || statementType === 'purpose') {
    result = result.replace(/\bBecome\s+an\s+an\s+/i, 'Become an ');
    result = result.replace(/\bHelp\s+the\s+the\s+/i, 'Help the ');
  }

  if (statementType === 'tagline') {
    const beats = result.split(/\.\s+/).map((b) => fixCoachPhrase(b)).filter(Boolean);
    return beats.map((b) => b.replace(/[.!?]+$/, '')).join('. ') + (beats.length ? '.' : '');
  }

  return result.replace(/\s+([,.!?])/g, '$1').trim();
}

/** @param {string} text */
export function coachStatementLooksGibberish(text) {
  const cleaned = String(text ?? '').trim();
  if (!cleaned) return true;
  if (/\bn\s+influ/i.test(cleaned)) return true;
  if (/\b(develops|builds)\s+(influential|leader)\s+.*\b(develops|builds)\s+(influential|leader)\b/i.test(cleaned)) {
    return true;
  }

  const words = cleaned.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length >= 6) {
    const unique = new Set(words);
    if (unique.size / words.length < 0.45) return true;
  }

  let repeats = 0;
  for (let i = 1; i < words.length; i += 1) {
    if (words[i] === words[i - 1]) repeats += 1;
  }
  return repeats >= 2;
}

/** @param {string} value @param {string[]} learned */
function pickFieldValue(value, learned) {
  const fixed = fixCoachPhrase(value);
  if (fixed && fixed.split(/\s+/).length >= 2 && !coachStatementLooksGibberish(fixed)) {
    return fixed;
  }
  if (fixed && fixed.length >= 4 && !/^n\s/i.test(fixed)) {
    return fixed;
  }
  return learned[0] ?? fixed;
}

/**
 * @param {Record<string, string>} fields
 * @param {Record<string, Record<string, string[]>>} lexicon
 * @param {'ambition' | 'impact' | 'purpose' | 'tagline'} statementType
 */
export function mergeFieldsWithLexicon(fields, lexicon, statementType) {
  const type = statementType === 'purpose' ? 'impact' : statementType;
  const bucket = lexicon[type] ?? emptyLexicon()[type];

  if (type === 'ambition') {
    return {
      role: pickFieldValue(fields.role ?? '', bucket.role ?? []),
      contribution: pickFieldValue(fields.contribution ?? '', bucket.contribution ?? []),
      mark: pickFieldValue(fields.mark ?? '', bucket.mark ?? []),
    };
  }

  if (type === 'impact') {
    return {
      audience: pickFieldValue(fields.audience ?? '', bucket.audience ?? []),
      outcome: pickFieldValue(fields.outcome ?? '', bucket.outcome ?? []),
    };
  }

  return {
    word1: pickFieldValue(fields.word1 ?? '', bucket.word1 ?? []),
    word2: pickFieldValue(fields.word2 ?? '', bucket.word2 ?? []),
    word3: pickFieldValue(fields.word3 ?? '', bucket.word3 ?? []),
  };
}

/**
 * @param {string} participantId
 * @param {{
 *   statementType: 'ambition' | 'impact' | 'purpose' | 'tagline',
 *   variant?: 'short' | 'balanced' | 'inspirational',
 *   fields?: Record<string, string>,
 * }} options
 */
export function regenerateCoachWithLearning(participantId, options) {
  const lexicon = getCoachLexicon(participantId);
  const merged = mergeFieldsWithLexicon(options.fields ?? {}, lexicon, options.statementType);
  const result = regenerateFromCustomization({ ...options, fields: merged });

  if (result.skipped) return result;

  const type = options.statementType;
  if (result.text) {
    result.text = polishCoachStatement(result.text, type);
  }
  if (result.variants) {
    for (const key of Object.keys(result.variants)) {
      result.variants[key] = polishCoachStatement(result.variants[key], type);
    }
  }

  if (result.text && coachStatementLooksGibberish(result.text)) {
    return {
      skipped: true,
      note: 'Try clearer replies — use short phrases like "Agency Director", "develops leaders", "a thriving team".',
    };
  }

  const learned = Boolean(lexicon[type]?.accepted?.length);
  recordCoachLearning(participantId, type, { fields: merged });
  result.note = learned
    ? `${result.note} I also used phrasing from your earlier drafts.`
    : result.note;

  return result;
}
