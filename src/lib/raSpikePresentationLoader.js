/**
 * RA-SPIKE coach presentation decks (weekly classroom slides).
 */
import { resolvePresentations, resolvePresentationSlides } from './contentLoader.js';

const presentationModules = import.meta.glob('../../content/ra-spike/week-*/day-*/presentation.json', {
  eager: true,
  import: 'default',
});

/** @param {string} path */
function raSpikePublicContentUrl(path) {
  if (!path || typeof path !== 'string') return path;
  if (path.startsWith('/ra-spike/')) return path;
  if (path.startsWith('/content/')) return `/ra-spike${path}`;
  return path;
}

/** @param {{ imageUrl?: string, [key: string]: unknown }} slide */
function mapSlideForRaPortal(slide) {
  return {
    ...slide,
    imageUrl: slide.imageUrl ? raSpikePublicContentUrl(slide.imageUrl) : slide.imageUrl,
  };
}

/**
 * @param {number} week
 * @param {number} [day]
 * @returns {{ presentation: import('../types/playbook').Presentation, slides: import('../types/playbook').Slide[] } | null}
 */
export function getRaSpikeCoachPresentation(week, day = 1) {
  const key = `../../content/ra-spike/week-${week}/day-${day}/presentation.json`;
  const raw = presentationModules[key];
  if (!raw?.presentation) return null;

  const [deck] = resolvePresentations(
    { presentation: /** @type {import('./contentLoader.js').DayContentBundle['presentation']} */ (raw) },
    [raw.presentation.id],
  );
  if (!deck) return null;

  return {
    presentation: deck.presentation,
    slides: resolvePresentationSlides(deck).map(mapSlideForRaPortal),
  };
}

/** @param {number} week @param {number} [day] */
export function hasRaSpikeCoachPresentation(week, day = 1) {
  return Boolean(getRaSpikeCoachPresentation(week, day)?.slides?.length);
}
