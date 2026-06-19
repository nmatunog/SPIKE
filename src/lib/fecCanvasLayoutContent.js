/**
 * Map FEC exemplar records into FecCanvasLayout display props.
 */
import { getCanvasSummary } from './canvasSummaryService.js';
import { getFecField, getFecUnifiedVentureProposition, getVentureScorecard } from './fecCanvasService.js';
import { loadVentureDesignRecord } from './ventureDesignStudioService.js';

/** @param {unknown} value */
function pickText(value) {
  const text = String(value ?? '').trim();
  return text || undefined;
}

/**
 * Build projection layout from a participant's synced canvas + venture design data.
 * @param {string} participantId
 */
export function buildFecLayoutParticipantContent(participantId) {
  if (!participantId) {
    return { mode: /** @type {'blank'} */ ('blank') };
  }

  const design = loadVentureDesignRecord(participantId);
  const draft = design.individual;
  const summary = getCanvasSummary(participantId);
  const scorecard = getVentureScorecard(participantId);

  const uvpFromSynthesis = pickText(draft?.step3?.synthesisA)
    ? `We help ${draft.step3.synthesisA} achieve ${draft.step3.synthesisB || '…'} through ${draft.step3.synthesisC || '…'}.`
    : undefined;
  const centerContent =
    getFecUnifiedVentureProposition(participantId)
    || uvpFromSynthesis
    || undefined;

  const who =
    pickText(getFecField(participantId, 'create_value', 'customer_segments'))
    || pickText(draft?.step1?.customer);
  const problem =
    pickText(getFecField(participantId, 'create_value', 'customer_problem'))
    || pickText(draft?.step1?.problem);
  const experience =
    pickText(getFecField(participantId, 'create_value', 'value_offering'))
    || pickText(draft?.step4?.clientFeeling);
  const partners = pickText(getFecField(participantId, 'enable_value', 'key_partners'));
  const winningStrategy =
    pickText(getFecField(participantId, 'create_value', 'value_offering'))
    || pickText(draft?.step3?.different);

  const hasContent = Boolean(
    centerContent
    || who
    || problem
    || experience
    || partners
    || pickText(summary.roadmap_12mo)
    || pickText(scorecard.revenue),
  );

  return {
    mode: hasContent ? /** @type {'full'} */ ('full') : /** @type {'blank'} */ ('blank'),
    centerContent,
    uvpDetailContent: centerContent,
    boxContents: {
      who_we_serve: who,
      problem_we_solve: problem,
      client_experience: experience,
      winning_strategy: winningStrategy,
      key_partners: partners,
    },
    complexContents: {
      growth_engines: {
        'ADVISOR EXCELLENCE': pickText(getFecField(participantId, 'create_value', 'value_offering')),
        'TEAM & LEADERSHIP': pickText(
          getFecField(participantId, 'agency_talent', 'talent_development_system'),
        ),
        'SYSTEMS & SCALE': pickText(
          getFecField(participantId, 'agency_leadership', 'growth_multipliers'),
        ),
      },
      financial_engine: {
        'REVENUE MODEL': pickText(getFecField(participantId, 'capture_value', 'revenue_streams')),
        ECONOMICS: pickText(getFecField(participantId, 'capture_value', 'cost_structure')),
        SUSTAINABILITY: pickText(getFecField(participantId, 'capture_value', 'profit_formula')),
      },
      venture_roadmap: {
        'YEAR 1: ADVISOR EXCELLENCE': pickText(summary.roadmap_12mo),
        'YEAR 2: UNIT LEADER': pickText(summary.roadmap_24mo),
        'YEARS 3–4: SENIOR UNIT MANAGER': pickText(summary.roadmap_36mo),
        'YEAR 5+: AGENCY DIRECTOR': pickText(summary.success_narrative),
      },
      measurement_dashboard: {
        CLIENTS: scorecard.clients
          ? `Active: ${scorecard.clients}${scorecard.conversion ? ` · Conversion: ${scorecard.conversion}` : ''}`
          : undefined,
        REVENUE: pickText(scorecard.revenue) || pickText(summary.success_revenue),
        PROTECTION: scorecard.families_protected
          ? `Families: ${scorecard.families_protected}${scorecard.premium_placed ? ` · Premium: ${scorecard.premium_placed}` : ''}`
          : pickText(summary.success_families_protected),
        RECRUITMENT: pickText(getFecField(participantId, 'agency_talent', 'recruitment_channels')),
        LEADERSHIP: pickText(getFecField(participantId, 'agency_leadership', 'leadership_system')),
        IMPACT: pickText(scorecard.lives_improved),
      },
    },
  };
}

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
