import { formatRagExamplesForPrompt } from './rag.js';

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
  } else if (task === 'venture_studio_coach' || task === 'venture_design_coach') {
    lines.push('Return ONLY valid JSON: {"bias":"short bias label","coach":"2-3 sentences","evidenceScore":"N/10"} — no markdown.');
    lines.push('Coach must reference the squad\'s actual words and segment. Never give generic advice that ignores their input.');
    lines.push('Bias is a sharp diagnostic label (max 12 words). Coach is a probing question or challenge in second person.');
    if (task === 'venture_design_coach') {
      lines.push('Context is Day 4 Venture Design Studio (FEC) — client segment, UVP, and brand. NEVER coach about the intern\'s personal internship goals or Day 1 identity work.');
      lines.push('Never paste the user\'s draft verbatim as the coach message.');
    }
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
  const {
    task,
    variant,
    fields = {},
    currentDraft = '',
    refineAction = '',
    statementType = '',
    ragExamples = [],
  } = payload;

  if (task === 'generate_cohort_finalists' && payload.prompt) {
    return String(payload.prompt);
  }

  const rules = buildRules(payload);
  const ragBlock = formatRagExamplesForPrompt(
    /** @type {Array<{ input_labels?: Record<string, unknown>, output_text?: string }>} */ (ragExamples),
  );
  const prefix = ragBlock ? `${ragBlock}\n\n` : '';

  if (task === 'generate_ambition') {
    return [
      prefix,
      'Write three ambition statement variants from these ranked motivators.',
      `Motivators (most important first): ${fields.motivators ?? ''}`,
      'Short = concise. Balanced = role + contribution. Inspirational = aspirational but specific.',
      rules,
    ].join('\n');
  }

  if (task === 'generate_impact') {
    return [
      prefix,
      'Write one impact statement — who they help and the difference they make.',
      `Audiences: ${fields.audiences ?? ''}`,
      rules,
      'Start with Help or Serve. Focus on others, not the intern becoming someone.',
    ].join('\n');
  }

  if (task === 'generate_tagline') {
    return [
      prefix,
      'Write a memorable personal tagline (3–6 words total, 2–3 short beats).',
      `Ambition: ${fields.ambition ?? ''}`,
      `Impact: ${fields.impact ?? ''}`,
      `Top values: ${fields.values ?? ''}`,
      rules,
    ].join('\n');
  }

  if (task === 'generate_values') {
    return [
      prefix,
      'Write one paragraph describing how these three values guide their leadership.',
      `Top 3 values (ranked): ${fields.values ?? ''}`,
      rules,
      'Use second person ("You are guided by…") or first person — match a coach tone.',
    ].join('\n');
  }

  if (task === 'generate_future_self') {
    return [
      prefix,
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
      prefix,
      'Turn these inputs into one ambition statement. Honor their ranked motivator cards even if role fields are brief.',
      `Style: ${variant ?? 'balanced'}.`,
      `Motivators (most important first): ${fields.motivators ?? ''}`,
      `Role: ${fields.role ?? ''}`,
      `What they will do: ${fields.contribution ?? ''}`,
      `What they will build or leave behind: ${fields.mark ?? ''}`,
      rules,
    ].join('\n');
  }

  if (task === 'regenerate_impact' || task === 'regenerate_purpose') {
    return [
      prefix,
      'Turn these inputs into one impact statement. Honor their selected audience cards.',
      `Audiences selected: ${fields.audiences ?? ''}`,
      `Who they help: ${fields.audience ?? ''}`,
      `Difference they create: ${fields.outcome ?? ''}`,
      rules,
    ].join('\n');
  }

  if (task === 'regenerate_tagline') {
    const beats = [fields.word1, fields.word2, fields.word3].filter(Boolean).join(' | ');
    return [
      prefix,
      'Turn these tagline beats into a short 2–3 phrase tagline.',
      `Beats: ${beats}`,
      rules,
    ].join('\n');
  }

  if (task === 'refine_statement') {
    return [
      prefix,
      'Refine this draft per the instruction. Keep the intern\'s voice and facts.',
      `Section: ${statementType || 'statement'}`,
      `Draft:\n${currentDraft}`,
      `Instruction: ${refineAction}`,
      rules,
    ].join('\n');
  }

  if (task === 'venture_studio_coach') {
    const step = payload.stepIndex ?? fields.step ?? '1';
    const hint = payload.localHint
      ? `Step learning goal (preserve this intent, personalize to their inputs):\nBias: ${payload.localHint.bias}\nCoach: ${payload.localHint.coach}`
      : '';
    return [
      prefix,
      `You are SPIKE Venture Coach reviewing Day 3 Market Discovery — Step ${step} of 5.`,
      hint,
      `Squad: ${fields.squadName || 'unnamed'}`,
      `Target segment: ${fields.targetSegment || '(empty)'}`,
      `Life stage: ${fields.stage || '(empty)'}`,
      `Day-in-life (money): ${fields.dayInLife || '(empty)'}`,
      `Squad surprise: ${fields.surprise || '(empty)'}`,
      `Goals from evidence: ${fields.goals || '(none)'}`,
      `Why emotionally: ${fields.whyImportant || '(empty)'}`,
      `Problems:\n${fields.problems || '(none)'}`,
      `Current solutions:\n${fields.solutions || '(none)'}`,
      `Insight: ${fields.insight || '(empty)'}`,
      `Unmet need: ${fields.unmetNeed || '(empty)'}`,
      `Value proposition: ${fields.valueCreation || '(empty)'}`,
      `Evidence library (${fields.evidenceCount} items): ${fields.evidenceNotes || '(no notes)'}`,
      'Challenge the squad with specifics from THEIR inputs. Quote or paraphrase their exact words.',
      'Never say "your segment" if Target segment above is filled — use their label verbatim.',
      rules,
    ].join('\n');
  }

  if (task === 'venture_design_coach') {
    const step = payload.stepIndex ?? fields.step ?? '1';
    const hint = payload.localHint
      ? `Step learning goal (preserve this intent, personalize to their inputs):\nBias: ${payload.localHint.bias}\nCoach: ${payload.localHint.coach}`
      : '';
    return [
      prefix,
      `You are SPIKE Venture Coach reviewing ${fields.programDay || 'Day 4 Venture Design Studio'} — Step ${step} of 5 (${fields.coachStepTitle || 'Venture Design'}).`,
      'This is NOT Day 1 personal ambition, NOT Day 3 research field notes. Coach only on venture design: client segment, problem, transformation, UVP, brand, FEC.',
      'If customer problem text sounds like the intern\'s own learning goals, call it out and redirect to the client\'s financial pain.',
      hint,
      `Squad: ${fields.squadName || 'unnamed'}`,
      `Target segment: ${fields.targetSegment || '(empty)'}`,
      `Customer problem (client pain, not intern goals): ${fields.customerProblem || '(empty)'}`,
      `Opportunity: ${fields.opportunity || '(empty)'}`,
      `Before feeling: ${fields.beforeFeeling || '(empty)'}`,
      `After feeling: ${fields.afterFeeling || '(empty)'}`,
      `UVP draft: ${fields.uvp || '(empty)'}`,
      `Who serve: ${fields.whoServe || '(empty)'}`,
      `Transformation: ${fields.transformation || '(empty)'}`,
      `Why us: ${fields.whyUs || '(empty)'}`,
      `Mechanism: ${fields.mechanism || '(empty)'}`,
      `Venture name: ${fields.ventureName || '(empty)'}`,
      `Tagline: ${fields.tagline || '(empty)'}`,
      `Client experience goal: ${fields.clientExperience || '(empty)'}`,
      'Write 2–3 sentences challenging the squad. Do NOT repeat their draft verbatim.',
      rules,
    ].join('\n');
  }

  return [`${prefix}Improve this coach draft.\nDraft: ${currentDraft}\n`, rules].join('\n');
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

    const text = String(parsed.text ?? parsed.coach ?? '').trim();
    const bias = String(parsed.bias ?? '').trim();
    const evidenceScore = String(parsed.evidenceScore ?? '').trim();
    if (!text && !parsed.variants) return null;
    if (bias) {
      return {
        text,
        bias,
        evidenceScore,
        summary: String(parsed.summary ?? '').trim(),
        note: String(parsed.note ?? '').trim(),
      };
    }
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
