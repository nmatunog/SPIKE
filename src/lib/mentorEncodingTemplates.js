import { getDayContentBundle } from './contentLoader.js';

/** @param {number} dayNum */
export function getMentorDayTemplates(dayNum) {
  try {
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
