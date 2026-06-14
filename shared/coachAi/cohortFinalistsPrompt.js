/**
 * Build prompt for consolidating cohort name suggestions into 3–5 finalists.
 * @param {Array<{ suggested_name: string, reason?: string }>} suggestions
 */
export function buildCohortFinalistsPrompt(suggestions) {
  const lines = suggestions.map((s, i) => {
    const reason = String(s.reason ?? '').trim();
    return `${i + 1}. "${s.suggested_name}"${reason ? ` — ${reason}` : ''}`;
  });

  return `You are helping name a founding cohort for SPIKE, a financial services internship program.

Participants submitted these cohort name ideas:

${lines.join('\n')}

Merge similar ideas, remove duplicates, normalize spelling, and produce 3 to 5 polished finalist cohort names.

Return ONLY valid JSON (no markdown):
{
  "finalists": [
    { "name": "Polished Name", "mergedFrom": ["original idea 1", "original idea 2"] }
  ]
}

Rules:
- Each name should be 1–3 words, memorable, professional
- No quotes inside names
- mergedFrom lists participant phrasing you combined`;
}

/**
 * @param {string} text
 * @returns {Array<{ name: string, mergedFrom: string[] }>}
 */
export function parseCohortFinalistsResponse(text) {
  const raw = String(text ?? '').trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return [];
  try {
    const data = JSON.parse(jsonMatch[0]);
    const list = Array.isArray(data?.finalists) ? data.finalists : [];
    return list
      .map((f) => ({
        name: String(f?.name ?? '').trim(),
        mergedFrom: Array.isArray(f?.mergedFrom) ? f.mergedFrom.map(String) : [],
      }))
      .filter((f) => f.name.length >= 2)
      .slice(0, 5);
  } catch {
    return [];
  }
}
