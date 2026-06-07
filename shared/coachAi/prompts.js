/** @param {Record<string, unknown>} payload */
function buildRules(payload) {
  const { task, wordLimit = 25, wordMin = 0, statementType = '' } = payload;
  const lines = [
    'Write in clear, natural English for a financial services intern in the Philippines.',
    'Avoid corporate filler (synergy, leverage, comprehensive, world-class).',
    'Use the intern\'s own words and intent; do not invent unrelated goals.',
  ];

  if (task === 'generate_future_self') {
    lines.push(`Write ${wordMin}–${wordLimit} words as a first-person narrative in 4–6 short paragraphs.`);
    lines.push(
      'Return ONLY valid JSON: {"text":"...","summary":"one sentence under 25 words","note":"..."} with no markdown.',
    );
  } else if (task === 'generate_ambition') {
    lines.push(`Short variant: max 15 words. Balanced: max ${wordLimit} words. Inspirational: max ${wordLimit} words.`);
    lines.push(
      'Return ONLY valid JSON: {"variants":{"short":"...","balanced":"...","inspirational":"..."},"note":"..."} with no markdown.',
    );
  } else if (task === 'generate_values') {
    lines.push(`Max ${wordLimit} words for the narrative paragraph (ranked list is separate).`);
    lines.push('Return ONLY valid JSON: {"text":"...","note":"..."} with no markdown.');
  } else {
    lines.push(`Stay within ${wordLimit} words.`);
    lines.push('Return ONLY valid JSON: {"text":"...","note":"..."} with no markdown.');
  }

  if (statementType === 'future-self' && task === 'refine_statement') {
    lines[3] = `Keep ${wordMin}–${wordLimit} words unless the instruction asks to shorten.`;
  }

  return lines.join('\n');
}

/** @param {Record<string, unknown>} payload */
export function buildCoachPrompt(payload) {
  const { task, variant, fields = {}, currentDraft = '', refineAction = '', statementType = '' } = payload;
  const rules = buildRules(payload);

  if (task === 'generate_ambition') {
    return [
      'Write three ambition statement variants from these ranked motivators.',
      `Motivators (most important first): ${fields.motivators ?? ''}`,
      'Short = concise. Balanced = role + contribution. Inspirational = aspirational but specific.',
      rules,
    ].join('\n');
  }

  if (task === 'generate_impact') {
    return [
      'Write one impact statement — who they help and the difference they make.',
      `Audiences: ${fields.audiences ?? ''}`,
      rules,
      'Start with Help or Serve. Focus on others, not the intern becoming someone.',
    ].join('\n');
  }

  if (task === 'generate_tagline') {
    return [
      'Write a memorable personal tagline (3–6 words total, 2–3 short beats).',
      `Ambition: ${fields.ambition ?? ''}`,
      `Impact: ${fields.impact ?? ''}`,
      `Top values: ${fields.values ?? ''}`,
      rules,
    ].join('\n');
  }

  if (task === 'generate_values') {
    return [
      'Write one paragraph describing how these three values guide their leadership.',
      `Top 3 values (ranked): ${fields.values ?? ''}`,
      rules,
      'Use second person ("You are guided by…") or first person — match a coach tone.',
    ].join('\n');
  }

  if (task === 'generate_future_self') {
    return [
      'Write a Future Self narrative set 3 years ahead, plus a one-sentence summary.',
      `Goals: ${fields.goals ?? ''}`,
      `Income level: ${fields.income ?? ''}`,
      `Impact they want: ${fields.impact ?? ''}`,
      `Success vision: ${fields.successVision ?? ''}`,
      rules,
      'Cover daily rhythm, financial level, impact, credibility, and long-term compounding.',
    ].join('\n');
  }

  if (task === 'regenerate_ambition') {
    return [
      'Turn these chat replies into one ambition statement.',
      `Style: ${variant ?? 'balanced'}.`,
      `Role: ${fields.role ?? ''}`,
      `What they will do: ${fields.contribution ?? ''}`,
      `What they will build or leave behind: ${fields.mark ?? ''}`,
      rules,
    ].join('\n');
  }

  if (task === 'regenerate_impact' || task === 'regenerate_purpose') {
    return [
      'Turn these replies into one impact statement.',
      `Who they help: ${fields.audience ?? ''}`,
      `Difference they create: ${fields.outcome ?? ''}`,
      rules,
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
      'Refine this draft per the instruction. Keep the intern\'s voice and facts.',
      `Section: ${statementType || 'statement'}`,
      `Draft:\n${currentDraft}`,
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
    const note = String(parsed.note ?? 'Draft updated.').trim();

    if (parsed.variants && typeof parsed.variants === 'object') {
      const variants = {
        short: String(parsed.variants.short ?? '').trim(),
        balanced: String(parsed.variants.balanced ?? '').trim(),
        inspirational: String(parsed.variants.inspirational ?? '').trim(),
      };
      if (!variants.balanced && !variants.short && !variants.inspirational) return null;
      const text = String(parsed.text ?? variants.balanced ?? variants.short ?? '').trim();
      return { text, variants, summary: String(parsed.summary ?? '').trim(), note };
    }

    const text = String(parsed.text ?? '').trim();
    if (!text) return null;
    return {
      text,
      summary: String(parsed.summary ?? '').trim(),
      note,
    };
  } catch {
    return null;
  }
}
