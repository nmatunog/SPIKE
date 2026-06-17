/**
 * Map FEC exemplar records into FecCanvasLayout display props.
 */

/**
 * @param {{
 *   summary: Record<string, string>,
 *   engines: Record<string, Record<string, string>>,
 * }} exemplar
 */
export function buildFecLayoutExemplarContent({ summary, engines }) {
  const create = engines.create_value ?? {};
  const capture = engines.capture_value ?? {};
  const enable = engines.enable_value ?? {};
  const prove = engines.prove_value ?? {};
  const talent = engines.agency_talent ?? {};
  const leadership = engines.agency_leadership ?? {};

  return {
    centerContent: summary.unified_venture_proposition,
    uvpDetailContent: summary.unified_venture_proposition,
    boxContents: {
      who_we_serve: create.customer_segments,
      problem_we_solve: create.customer_problem,
      client_experience: create.value_offering,
      winning_strategy:
        'Trusted AIA advisor positioning — digital-first discovery, milestone-based planning, and referral-led growth.',
      key_partners: enable.key_partners,
    },
    complexContents: {
      growth_engines: {
        'ADVISOR EXCELLENCE': create.value_offering,
        'TEAM & LEADERSHIP': talent.talent_development_system,
        'SYSTEMS & SCALE': leadership.growth_multipliers,
      },
      financial_engine: {
        'REVENUE MODEL': capture.revenue_streams,
        ECONOMICS: capture.cost_structure,
        SUSTAINABILITY: capture.profit_formula,
      },
      venture_roadmap: {
        'YEAR 1: ADVISOR EXCELLENCE': summary.roadmap_12mo,
        'YEAR 2: UNIT LEADER': summary.roadmap_24mo,
        'YEARS 3–4: SENIOR UNIT MANAGER': summary.roadmap_36mo,
        'YEAR 5+: AGENCY DIRECTOR': summary.success_narrative,
      },
      measurement_dashboard: {
        CLIENTS: `Active: ${prove.clients} · Conversion: ${prove.conversion}`,
        REVENUE: prove.revenue,
        PROTECTION: `Families: ${prove.families_protected} · Premium: ${prove.premium_placed}`,
        RECRUITMENT: talent.recruitment_channels,
        LEADERSHIP: leadership.leadership_system,
        IMPACT: prove.lives_improved,
      },
    },
  };
}
