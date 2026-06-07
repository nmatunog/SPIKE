/**
 * SPIKE Venture Readiness Score™ — Sprint 05C executive canvas scorecard.
 * Weights: Ambition & Purpose 15%, Canvas 20%, Market 15%, Client 15%, Recruitment 15%,
 * Leadership 10%, Career 10%.
 */

/**
 * @param {Record<string, number>} blueprintSections — slug → completion %
 */
export function computeVentureReadinessScore(blueprintSections) {
  const sections = blueprintSections ?? {};
  const dimensions = {
    vision_purpose: clamp(sections['vision-purpose'] ?? 0),
    canvas: clamp(sections.canvas ?? 0),
    market_intelligence: clamp(sections['market-intelligence'] ?? 0),
    client_growth: clamp(sections['client-growth'] ?? 0),
    recruitment_growth: clamp(sections['recruitment-growth'] ?? 0),
    leadership_growth: clamp(sections['leadership-growth'] ?? 0),
    career_progress: clamp(sections['career-accelerator'] ?? 0),
  };

  const composite = Math.round(
    dimensions.vision_purpose * 0.15
    + dimensions.canvas * 0.2
    + dimensions.market_intelligence * 0.15
    + dimensions.client_growth * 0.15
    + dimensions.recruitment_growth * 0.15
    + dimensions.leadership_growth * 0.1
    + dimensions.career_progress * 0.1,
  );

  return { dimensions, composite: clamp(composite) };
}

/** @param {number} value */
function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export const VENTURE_READINESS_WEIGHTS = [
  { key: 'vision_purpose', label: 'Ambition & Impact', weight: 15 },
  { key: 'canvas', label: 'Canvas', weight: 20 },
  { key: 'market_intelligence', label: 'Market Intelligence', weight: 15 },
  { key: 'client_growth', label: 'Client Growth', weight: 15 },
  { key: 'recruitment_growth', label: 'Recruitment Growth', weight: 15 },
  { key: 'leadership_growth', label: 'Leadership Growth', weight: 10 },
  { key: 'career_progress', label: 'Career Progress', weight: 10 },
];
