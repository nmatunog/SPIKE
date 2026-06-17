/**
 * Resolve LLM API keys for coach tasks.
 * Research canvas (venture_studio_coach) can use a dedicated OpenAI key.
 *
 * @param {string} task
 * @param {Record<string, string | undefined>} env
 */
export function resolveCoachApiKeys(task, env = {}) {
  const geminiApiKey = env.GEMINI_API_KEY;
  const sharedOpenAi = env.OPENAI_API_KEY;
  const researchOpenAi = env.VENTURE_STUDIO_OPENAI_API_KEY || sharedOpenAi;

  return {
    geminiApiKey,
    openaiApiKey:
      task === 'venture_studio_coach' || task === 'venture_design_coach' ? researchOpenAi : sharedOpenAi,
  };
}
