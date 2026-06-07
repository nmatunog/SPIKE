/** @param {Record<string, unknown>} payload */
export function buildCoachPrompt(payload) {
  const { task, variant, fields = {}, wordLimit = 25, currentDraft = '', refineAction = '' } = payload;

  const rules = [
    'Write in clear, natural English for a financial services intern in the Philippines.',
    'Avoid corporate filler (synergy, leverage, comprehensive, world-class).',
    'Use the intern\'s own words and intent; do not invent unrelated goals.',
    `Stay within ${wordLimit} words for the statement.`,
    'Return ONLY valid JSON: {"text":"...","note":"..."} with no markdown.',
  ].join('\n');

  if (task === 'regenerate_ambition') {
    const role = fields.role ?? '';
    const contribution = fields.contribution ?? '';
    const mark = fields.mark ?? '';
    return [
      'Turn these chat replies into one ambition statement.',
      `Style: ${variant ?? 'balanced'}.`,
      `Role: ${role}`,
      `What they will do: ${contribution}`,
      `What they will build or leave behind: ${mark}`,
      rules,
      'Template guide (adapt naturally): Become [role] who [contribution] and [mark].',
    ].join('\n');
  }

  if (task === 'regenerate_impact' || task === 'regenerate_purpose') {
    return [
      'Turn these replies into one impact statement.',
      `Who they help: ${fields.audience ?? ''}`,
      `Difference they create: ${fields.outcome ?? ''}`,
      rules,
      'Template guide: Help [audience] [outcome].',
    ].join('\n');
  }

  if (task === 'regenerate_tagline') {
    const beats = [fields.word1, fields.word2, fields.word3].filter(Boolean).join(' | ');
    return [
      'Turn these tagline beats into a short 2–3 phrase tagline.',
      `Beats: ${beats}`,
      rules,
    ].join('\n');
  }

  if (task === 'refine_statement') {
    return [
      'Refine this draft per the instruction. Keep the intern\'s voice.',
      `Draft: ${currentDraft}`,
      `Instruction: ${refineAction}`,
      rules,
    ].join('\n');
  }

  return [`Improve this coach draft.\nDraft: ${currentDraft}\n`, rules].join('\n');
}

/** @param {string} raw */
export function parseModelJson(raw) {
  const trimmed = String(raw ?? '').trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const text = String(parsed.text ?? '').trim();
    if (!text) return null;
    return {
      text,
      note: String(parsed.note ?? 'Draft updated.').trim(),
    };
  } catch {
    return null;
  }
}
