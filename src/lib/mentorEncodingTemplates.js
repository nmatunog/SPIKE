/**
 * Mentor observation/debrief templates from day content bundles.
 * contentLoader is imported dynamically so mentor home does not block on the full curriculum chunk.
 */

/** @param {number} dayNum */
export async function loadMentorDayTemplates(dayNum) {
  try {
    const { getDayContentBundle } = await import('./contentLoader.js');
    const bundle = getDayContentBundle('segment-1', 'week-1', `day-${dayNum}`);
    const templates = bundle?.evaluations?.templates ?? [];
    const mentorTemplates = templates.filter((t) => t.audience === 'mentor');
    return {
      observation: mentorTemplates.find((t) => t.type === 'observation_form') ?? null,
      debrief: mentorTemplates.find((t) => t.type === 'reflection_form') ?? null,
    };
  } catch {
    return { observation: null, debrief: null };
  }
}

/** Friendly labels for 1–5 tap ratings */
export const RATING_HINTS = ['Building', 'Growing', 'Solid', 'Strong', 'Standout'];
