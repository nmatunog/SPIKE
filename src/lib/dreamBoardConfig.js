/** Minimum dream cards with captions required to publish. */
export const DREAM_BOARD_MIN_COMPLETE_CARDS = 3;

/** Default max dream cards when env override is not set. */
export const DREAM_BOARD_DEFAULT_MAX_CARDS = 12;

/** Hard ceiling for env / sanity checks. */
export const DREAM_BOARD_ABSOLUTE_MAX_CARDS = 24;

/**
 * Max dream board cards allowed in Studio and on the 16:9 portfolio slide.
 * Override per deploy with `VITE_DREAM_BOARD_MAX_CARDS` (3–24).
 */
export function getDreamBoardMaxCards() {
  const parsed = Number(import.meta.env.VITE_DREAM_BOARD_MAX_CARDS);
  if (
    Number.isFinite(parsed) &&
    parsed >= DREAM_BOARD_MIN_COMPLETE_CARDS &&
    parsed <= DREAM_BOARD_ABSOLUTE_MAX_CARDS
  ) {
    return Math.floor(parsed);
  }
  return DREAM_BOARD_DEFAULT_MAX_CARDS;
}

/**
 * Tailwind grid classes for the 16:9 dream board slide collage.
 * @param {number} count
 */
export function dreamBoardSlideGridClass(count) {
  if (count <= 1) return 'grid-cols-1 grid-rows-1';
  if (count === 2) return 'grid-cols-2 grid-rows-1';
  if (count === 3) return 'grid-cols-3 grid-rows-1';
  if (count === 4) return 'grid-cols-2 grid-rows-2';
  if (count === 5) return 'grid-cols-3 grid-rows-2';
  if (count === 6) return 'grid-cols-3 grid-rows-2 md:grid-cols-2 md:grid-rows-3';
  if (count <= 6) return 'grid-cols-3 grid-rows-2';
  if (count <= 9) return 'grid-cols-3 grid-rows-3';
  if (count <= 12) return 'grid-cols-4 grid-rows-3';
  return 'grid-cols-4 grid-rows-4';
}

/**
 * Tailwind line-clamp for slide captions — more lines when fewer cards on screen.
 * @param {number} count
 */
export function dreamBoardCaptionClampClass(count) {
  if (count <= 1) return 'line-clamp-8';
  if (count === 2) return 'line-clamp-6';
  if (count <= 4) return 'line-clamp-5';
  if (count <= 6) return 'line-clamp-4';
  return 'line-clamp-3';
}
