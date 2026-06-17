import { z } from 'zod';
import { generateCoachText } from '../../shared/coachAi/generate.js';

const coachGenerateSchema = z.object({
  task: z.enum([
    'generate_ambition',
    'generate_impact',
    'generate_tagline',
    'generate_values',
    'generate_future_self',
    'regenerate_ambition',
    'regenerate_impact',
    'regenerate_purpose',
    'regenerate_tagline',
    'refine_statement',
    'venture_studio_coach',
  ]),
  variant: z.enum(['short', 'balanced', 'inspirational']).optional(),
  fields: z.record(z.string()).optional(),
  wordLimit: z.number().int().positive().optional(),
  wordMin: z.number().int().nonnegative().optional(),
  statementType: z
    .enum(['ambition', 'impact', 'purpose', 'tagline', 'values', 'future-self'])
    .optional(),
  currentDraft: z.string().optional(),
  refineAction: z.string().optional(),
  stepIndex: z.number().int().min(1).max(5).optional(),
  localHint: z
    .object({
      bias: z.string().optional(),
      coach: z.string().optional(),
    })
    .optional(),
  ragExamples: z
    .array(
      z.object({
        input_labels: z.record(z.unknown()).optional(),
        output_text: z.string(),
        variant: z.string().nullable().optional(),
      }),
    )
    .optional(),
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
      coach: result.text,
      bias: result.bias,
      evidenceScore: result.evidenceScore,
      note: result.note,
      provider: result.provider,
      variants: result.variants,
      summary: result.summary,
      unavailable: false,
    });
  });
}
