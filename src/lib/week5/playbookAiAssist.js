/**
 * Rule-based AI Assist suggestions for Week 5 playbook fields (non-blocking).
 * @param {string} fieldId
 * @param {string} value
 * @param {Record<string, string>} [context]
 */
export function suggestPlaybookFieldAssist(fieldId, value, context = {}) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    if (fieldId === 'ventureOneSentence') {
      return 'Try: For [customer segment], we help [outcome] by [approach] — different because [edge].';
    }
    if (fieldId === 'clientPromise') {
      return context.customerProblem
        ? `Connect the promise to: ${context.customerProblem.slice(0, 120)}…`
        : 'State a specific, believable outcome the client will remember.';
    }
    if (fieldId === 'mainPitchMessage') {
      return 'One sentence the panel should repeat after you leave the room.';
    }
    return '';
  }
  if (trimmed.length < 25) {
    return 'You may want to make this more specific — who, what problem, and what outcome?';
  }
  if (fieldId.includes('revenue') || fieldId.includes('Weekly')) {
    if (!/\d/.test(trimmed)) return 'What number would make this more credible for the panel?';
  }
  if (fieldId === 'ventureOneSentence' && trimmed.split(/\s+/).length > 35) {
    return 'Can you shorten this to one clear sentence the panel can remember?';
  }
  if (fieldId === 'weakestSection') {
    return 'Which assumption would a skeptical panelist challenge first?';
  }
  return '';
}

/** @param {string} text @param {number} [min] */
export function softGuidanceForText(text, min = 20) {
  const t = String(text ?? '').trim();
  if (!t) return 'This section is still open for refinement.';
  if (t.length < min) return 'You may want to add more detail before the pitch.';
  return '';
}

/**
 * Revenue funnel soft warning — informational only.
 * @param {{ weeklyProspects?: string, weeklyPresentations?: string, weeklyClients?: string }} inputs
 */
export function revenueLogicSoftWarning(inputs) {
  const prospects = Number(inputs.weeklyProspects) || 0;
  const presentations = Number(inputs.weeklyPresentations) || 0;
  const clients = Number(inputs.weeklyClients) || 0;
  if (clients > presentations && presentations > 0) {
    return 'Your projected clients are higher than your projected presentations. Review the conversion assumptions.';
  }
  if (presentations > prospects && prospects > 0) {
    return 'Presentations exceed prospects — check your funnel math.';
  }
  return '';
}
