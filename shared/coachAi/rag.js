/**
 * RAG helpers for coach prompts — token overlap scoring + example formatting.
 */

/** @param {string} text */
export function tokenizeForRag(text) {
  return String(text ?? '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

/**
 * @param {Record<string, unknown>} queryLabels
 * @param {{ input_labels?: Record<string, unknown>, output_text?: string }} example
 */
export function scoreRagExample(queryLabels, example) {
  const queryTokens = new Set(tokenizeForRag(JSON.stringify(queryLabels ?? {})));
  const exampleTokens = tokenizeForRag(
    `${JSON.stringify(example.input_labels ?? {})} ${example.output_text ?? ''}`,
  );

  let overlap = 0;
  for (const token of exampleTokens) {
    if (queryTokens.has(token)) overlap += 1;
  }

  return overlap;
}

/**
 * @param {Array<{ input_labels?: Record<string, unknown>, output_text?: string, variant?: string }>} examples
 * @param {Record<string, unknown>} queryLabels
 * @param {number} [limit]
 */
export function pickTopRagExamples(examples, queryLabels, limit = 3) {
  if (!examples?.length) return [];

  return [...examples]
    .map((example) => ({
      ...example,
      score: scoreRagExample(queryLabels, example),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ input_labels, output_text, variant }) => ({
      input_labels: input_labels ?? {},
      output_text: String(output_text ?? '').trim(),
      variant: variant ?? null,
    }))
    .filter((example) => example.output_text.length >= 12);
}

/**
 * @param {Array<{ input_labels?: Record<string, unknown>, output_text?: string }>} examples
 */
export function formatRagExamplesForPrompt(examples) {
  if (!examples?.length) return '';

  const lines = examples.map((example, index) => {
    const inputs = Object.entries(example.input_labels ?? {})
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
    return `Example ${index + 1}${inputs ? ` (${inputs})` : ''}: "${example.output_text}"`;
  });

  return [
    'Use these real accepted SPIKE coach statements as style references (match tone and structure; do not copy verbatim):',
    ...lines,
  ].join('\n');
}
