/**
 * SPIKE Readiness Score™ — composite until Engine 3 persists dimension scores.
 * Weights from PRD: Learning 20%, Portfolio 20%, Production 20%, Recruitment 15%,
 * Leadership 15%, Professionalism 10%.
 */

/**
 * @param {{ hours?: number, segment?: number, licensed?: boolean } | null | undefined} progress
 * @param {{ fnaCount?: number }} [options]
 */
export function computeSpikeReadinessScore(progress, options = {}) {
  const hours = progress?.hours ?? 0;
  const segment = progress?.segment ?? 1;
  const licensed = progress?.licensed ?? false;
  const fnaCount = options.fnaCount ?? 0;

  const learning = Math.min(100, Math.round((hours / 200) * 100));
  const portfolio = Math.min(100, Math.round((hours / 600) * 22 * 4.5));
  const productionFromHours = hours >= 110 ? 100 : Math.round((hours / 110) * 100);
  const productionFromFnas = fnaCount > 0 ? Math.min(100, 35 + fnaCount * 20) : 0;
  const production = Math.max(productionFromHours, productionFromFnas);
  const recruitment = segment >= 2 ? Math.min(100, Math.round(((hours - 200) / 200) * 100)) : Math.round((hours / 80) * 40);
  const leadership = segment >= 3 ? Math.min(100, Math.round(((hours - 400) / 200) * 100)) : Math.round((hours / 400) * 30);
  const professionalism = licensed ? 100 : Math.min(100, Math.round((hours / 160) * 85));

  const dimensions = {
    learning: clamp(learning),
    portfolio: clamp(portfolio),
    production: clamp(production),
    recruitment: clamp(recruitment),
    leadership: clamp(leadership),
    professionalism: clamp(professionalism),
  };

  const composite = Math.round(
    dimensions.learning * 0.2
    + dimensions.portfolio * 0.2
    + dimensions.production * 0.2
    + dimensions.recruitment * 0.15
    + dimensions.leadership * 0.15
    + dimensions.professionalism * 0.1,
  );

  return { dimensions, composite: clamp(composite) };
}

/** @param {number} value */
function clamp(value) {
  return Math.max(0, Math.min(100, value));
}
