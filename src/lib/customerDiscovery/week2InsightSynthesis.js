/**
 * Lightweight local insight extraction from interview answers (no API).
 */

/** @param {string} text */
function sentences(text) {
  return String(text ?? '')
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
}

/** @param {string[]} answers */
export function extractInterviewInsights(answers) {
  const joined = answers.filter(Boolean).join(' ').toLowerCase();
  const goals = [];
  const painPoints = [];
  const themes = [];
  const opportunities = [];
  const quotes = [];
  const protectionGaps = [];

  for (const ans of answers) {
    const trimmed = String(ans ?? '').trim();
    if (trimmed.length > 20) quotes.push(trimmed.slice(0, 160));
  }

  if (/goal|dream|want|hope|plan|save|invest|retire|education|house|business/.test(joined)) {
    goals.push('Customer expressed financial goals or aspirations in conversation.');
  }
  if (/worry|stress|afraid|debt|struggle|hard|difficult|can't|cannot|lack/.test(joined)) {
    painPoints.push('Financial stress or uncertainty surfaced during discovery.');
  }
  if (/family|budget|cash|income|remit|emergency|insurance|protection|health/.test(joined)) {
    themes.push('Money, protection, and family priorities emerged as themes.');
  }
  if (/help|advice|guidance|trust|someone|coach|plan|structure/.test(joined)) {
    opportunities.push('Openness to structured financial guidance detected.');
  }
  if (/insurance|protect|coverage|policy|benefit|emergency fund|safety net/.test(joined)) {
    protectionGaps.push('Protection or emergency planning gap mentioned or implied.');
  }

  const fallback = sentences(joined)[0];
  if (!goals.length && fallback) goals.push(`Goal signal: ${fallback.slice(0, 100)}`);
  if (!painPoints.length && /challenge|problem|issue/.test(joined)) {
    painPoints.push('Customer described a financial challenge worth validating.');
  }

  return {
    goals: goals.slice(0, 3),
    painPoints: painPoints.slice(0, 3),
    themes: themes.slice(0, 3),
    opportunities: opportunities.slice(0, 3),
    quotes: quotes.slice(0, 3),
    protectionGaps: protectionGaps.slice(0, 3),
  };
}

/** @param {import('./week2DiscoveryTypes.js').Week2EncodedInterview[]} interviews */
export function aggregateSquadIntelligence(interviews) {
  const encoded = interviews.filter((i) => i.encoded);
  const allGoals = [];
  const allChallenges = [];
  const allQuotes = [];
  const allRisks = [];
  const allOpportunities = [];

  for (const iv of encoded) {
    const ins = iv.aiInsights ?? {};
    allGoals.push(...(ins.goals ?? []));
    allChallenges.push(...(ins.painPoints ?? []));
    allQuotes.push(...(ins.quotes ?? []));
    allRisks.push(...(ins.protectionGaps ?? []));
    allOpportunities.push(...(ins.opportunities ?? []));
  }

  const top = (arr) => [...new Set(arr)].slice(0, 5);

  return {
    mostCommonGoals: top(allGoals),
    mostCommonChallenges: top(allChallenges),
    mostCommonQuotes: top(allQuotes),
    mostCommonRisks: top(allRisks),
    emergingOpportunities: top(allOpportunities),
    interviewCount: encoded.length,
  };
}
