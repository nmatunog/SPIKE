import { z } from 'zod';
import { generateCoachText } from '../../shared/coachAi/generate.js';

const coachGenerateSchema = z.object({
  task: z.enum([
    'regenerate_ambition',
    'regenerate_impact',
    'regenerate_purpose',
    'regenerate_tagline',
    'refine_statement',
  ]),
  variant: z.enum(['short', 'balanced', 'inspirational']).optional(),
  fields: z.record(z.string()).optional(),
  wordLimit: z.number().int().positive().optional(),
  currentDraft: z.string().optional(),
  refineAction: z.string().optional(),
});

/** @param {import('express').Express} app */
export function registerCoachRoutes(app) {
  app.post('/api/coach/generate', async (req, res) => {
    const parsed = coachGenerateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.flatten() });
    }

    const result = await generateCoachText(parsed.data, {
      geminiApiKey: process.env.GEMINI_API_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY,
    });

    if (!result.ok) {
      return res.status(503).json({
        message: 'AI coach unavailable.',
        reason: result.reason,
        failures: result.failures ?? [],
      });
    }

    return res.json({
      text: result.text,
      note: result.note,
      provider: result.provider,
    });
  });
}
