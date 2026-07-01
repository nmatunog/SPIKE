import { saveFecField, saveFecSummaryField, saveVentureScorecardMetric } from '../fecCanvasService.js';
import { BUSINESS_LEVERS } from './constants.js';
import { appendBlueprintTimelineEvent } from '../blueprintTimeline.js';
import { createPortfolioArtifactDraft } from '../blueprintArtifacts.js';

const DRAFT_STORAGE_KEY = 'spike_bec_fec_engine_draft';

/** @typedef {'advisorExcellence' | 'teamLeadership' | 'systemsScale' | 'revenueModel' | 'economics' | 'sustainability'} BecFecEngineDraftKey */

/**
 * @typedef {Record<BecFecEngineDraftKey, string>} BecFecEngineDraft
 * @typedef {BecFecEngineDraft & { submittedAt?: string | null, updatedAt?: string | null }} BecFecEngineDraftRecord
 */

export const BEC_FEC_ENGINE_SECTIONS = [
  {
    group: 'growth',
    groupLabel: 'FEC Box 6 · Growth Engines',
    fields: [
      {
        id: 'advisorExcellence',
        label: 'Advisor Excellence',
        subtitle: 'Client acquisition · planning · experience · referrals',
        fecEngine: 'create_value',
        fecField: 'value_offering',
      },
      {
        id: 'teamLeadership',
        label: 'Team & Leadership',
        subtitle: 'Recruitment · coaching · leadership · culture',
        fecEngine: 'agency_talent',
        fecField: 'talent_development_system',
      },
      {
        id: 'systemsScale',
        label: 'Systems & Scale',
        subtitle: 'Processes · technology · training · operations',
        fecEngine: 'agency_leadership',
        fecField: 'growth_multipliers',
      },
    ],
  },
  {
    group: 'financial',
    groupLabel: 'FEC Box 8 · Financial Engine',
    fields: [
      {
        id: 'revenueModel',
        label: 'Revenue Model',
        subtitle: 'Streams · pricing · deal size · targets',
        fecEngine: 'capture_value',
        fecField: 'revenue_streams',
      },
      {
        id: 'economics',
        label: 'Economics',
        subtitle: 'Cost structure · margin · operating leverage',
        fecEngine: 'capture_value',
        fecField: 'cost_structure',
      },
      {
        id: 'sustainability',
        label: 'Sustainability',
        subtitle: 'Profitability · cash flow · break-even · reinvestment',
        fecEngine: 'capture_value',
        fecField: 'profit_formula',
      },
    ],
  },
];

/** @param {number | string} n */
function fmtPeso(n) {
  const num = Number(n);
  return Number.isFinite(num) && num > 0 ? `₱${num.toLocaleString()}` : '—';
}

/** @returns {BecFecEngineDraft} */
export function emptyBecFecEngineDraft() {
  return {
    advisorExcellence: '',
    teamLeadership: '',
    systemsScale: '',
    revenueModel: '',
    economics: '',
    sustainability: '',
  };
}

/**
 * Build Growth Engine + Financial Engine draft text from Business Engine Canvas final figures.
 * @param {import('./types.js').BusinessEngineCanvasState} state
 * @returns {BecFecEngineDraft}
 */
export function buildFecEngineDraftFromCanvas(state) {
  const leverLabel = BUSINESS_LEVERS.find((l) => l.id === state.businessLever)?.label ?? '';
  const weekly = state.weeklyTargets;
  const monthly = state.monthlyTargets;
  const year1 = state.year1Targets;
  const revPerClient = Number(state.activityEngine.revenue?.value) || 10000;
  const year1RevRaw = state.reflections.year1RevenueGoal || year1.revenue || '';
  const weeklyRev = Number(weekly.revenue) || 0;
  const monthlyRev = Number(monthly.revenue) || weeklyRev * 4;
  const year1RevNum = Number(year1RevRaw) || Number(year1.revenue) || monthlyRev * 12;
  const cur = state.growthSimulation.current;
  const neu = state.growthSimulation.new;

  const year1Clients = year1.newClients || (Number(monthly.newClients) ? Number(monthly.newClients) * 12 : '');
  const year1Referrals = year1.referrals || (Number(monthly.referrals) ? Number(monthly.referrals) * 12 : '');

  return {
    advisorExcellence: [
      'CLIENT ACQUISITION & ADVISOR EXCELLENCE',
      `Activity Engine: ${state.activityEngine.prospects?.value ?? 10} prospects → ${state.activityEngine.discovery?.value ?? 5} discovery → ${state.activityEngine.clients?.value ?? 1} new client/week`,
      `Weekly targets: ${weekly.prospects} prospects · ${weekly.discoveryConversations} discovery · ${weekly.solutionPresentations} presentations · ${weekly.newClients} clients`,
      `Weekly revenue: ${fmtPeso(weeklyRev)} · Referrals: ${weekly.referrals}/week`,
      leverLabel ? `Primary business lever: ${leverLabel}` : '',
      state.reflections.firstImprovement
        ? `First team improvement: ${state.reflections.firstImprovement}`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),

    teamLeadership: [
      'TEAM & LEADERSHIP ENGINE',
      year1Clients ? `Year 1 new clients target: ${year1Clients}` : '',
      year1Referrals ? `Year 1 referrals target: ${year1Referrals}` : '',
      `Growth path — clients: ${cur.clients} → ${neu.clients} · revenue: ${fmtPeso(cur.revenue)} → ${fmtPeso(neu.revenue)}`,
      'Leadership focus: coach weekly production rhythm, discovery quality, and referral culture.',
    ]
      .filter(Boolean)
      .join('\n'),

    systemsScale: [
      'SYSTEMS & SCALE',
      `Monthly engine: ${monthly.prospects} prospects · ${monthly.discoverySessions} discovery · ${monthly.newClients} clients · ${fmtPeso(monthlyRev)} revenue`,
      state.reflections.engineProducesBusiness
        ? `Engine fit: ${state.reflections.engineProducesBusiness}`
        : '',
      state.reflections.biggestWeakness ? `Priority fix: ${state.reflections.biggestWeakness}` : '',
      'Operating formula: Weekly × 4 = Monthly · Monthly × 12 = Year 1.',
    ]
      .filter(Boolean)
      .join('\n'),

    revenueModel: [
      'REVENUE MODEL',
      `Weekly: ${fmtPeso(weeklyRev)} · Monthly: ${fmtPeso(monthlyRev)} · Year 1: ${fmtPeso(year1RevNum)}`,
      `Revenue per client (engine model): ${fmtPeso(revPerClient)}`,
      `Year 1 revenue commitment: ${fmtPeso(year1RevRaw || year1RevNum)}`,
    ].join('\n'),

    economics: [
      'ECONOMICS',
      `Monthly revenue at target run-rate: ${fmtPeso(monthlyRev)}`,
      `Contribution per new client: ${fmtPeso(revPerClient)}`,
      'Variable costs: prospecting time, client meetings, travel, communication tools.',
      'Fixed costs: licensing, training, platform — scale with activity before headcount.',
    ].join('\n'),

    sustainability: [
      'SUSTAINABILITY & PROFIT',
      year1RevNum ? `Year 1 revenue target: ${fmtPeso(year1RevNum)}` : '',
      year1Clients ? `Year 1 clients: ${year1Clients}` : '',
      year1Referrals ? `Year 1 referrals: ${year1Referrals}` : '',
      'Break-even: sustain monthly projection consistently before scaling team.',
      state.reflections.year1RevenueGoal
        ? `Committed Year 1 revenue: ${fmtPeso(state.reflections.year1RevenueGoal)}`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

function readDraftStore() {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeDraftStore(data) {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
}

/**
 * @param {string} participantId
 * @param {import('./types.js').BusinessEngineCanvasState} [canvasState]
 */
export function loadBecFecEngineDraft(participantId, canvasState = null) {
  if (!participantId) {
    return { ...emptyBecFecEngineDraft(), submittedAt: null, updatedAt: null };
  }
  const stored = readDraftStore()[participantId] ?? {};
  const fromCanvas = canvasState ? buildFecEngineDraftFromCanvas(canvasState) : emptyBecFecEngineDraft();
  /** @type {BecFecEngineDraftRecord} */
  const merged = {
    ...fromCanvas,
    ...emptyBecFecEngineDraft(),
    ...stored,
    submittedAt: stored.submittedAt ?? null,
    updatedAt: stored.updatedAt ?? null,
  };
  for (const key of Object.keys(emptyBecFecEngineDraft())) {
    if (!String(merged[key] ?? '').trim() && String(fromCanvas[key] ?? '').trim()) {
      merged[key] = fromCanvas[key];
    }
  }
  return merged;
}

/**
 * @param {string} participantId
 * @param {Partial<BecFecEngineDraftRecord>} patch
 */
export function saveBecFecEngineDraft(participantId, patch) {
  if (!participantId) return loadBecFecEngineDraft('');
  const all = readDraftStore();
  const next = {
    ...loadBecFecEngineDraft(participantId),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  all[participantId] = next;
  writeDraftStore(all);
  return next;
}

/**
 * @param {string} participantId
 * @param {import('./types.js').BusinessEngineCanvasState} canvasState
 */
export function refreshBecFecEngineDraftFromCanvas(participantId, canvasState) {
  const built = buildFecEngineDraftFromCanvas(canvasState);
  return saveBecFecEngineDraft(participantId, { ...built, submittedAt: null });
}

/**
 * @param {BecFecEngineDraftRecord} draft
 */
export function isBecFecEngineDraftSubmittable(draft) {
  return BEC_FEC_ENGINE_SECTIONS.every((section) =>
    section.fields.every((field) => String(draft[field.id] ?? '').trim().length >= 20),
  );
}

/**
 * Push Growth Engine + Financial Engine content to FEC and scorecard.
 * @param {string} participantId
 * @param {BecFecEngineDraftRecord} draft
 * @param {import('./types.js').BusinessEngineCanvasState} canvasState
 */
export function submitBecFecEngineToFec(participantId, draft, canvasState) {
  if (!participantId) return;

  for (const section of BEC_FEC_ENGINE_SECTIONS) {
    for (const field of section.fields) {
      const text = String(draft[field.id] ?? '').trim().slice(0, 2000);
      if (text) saveFecField(participantId, field.fecEngine, field.fecField, text);
    }
  }

  const year1Rev =
    canvasState.reflections.year1RevenueGoal
    || canvasState.year1Targets.revenue
    || '';
  const year1Clients = canvasState.year1Targets.newClients || '';
  const year1Referrals = canvasState.year1Targets.referrals || '';
  const monthlyRev = Number(canvasState.monthlyTargets.revenue) || 0;

  if (year1Rev) {
    saveFecSummaryField(participantId, {
      year1_goal: `Year 1 revenue target: ${fmtPeso(year1Rev)} (Business Engine Canvas)`,
      success_revenue: String(year1Rev),
    });
  }
  if (year1Clients) saveVentureScorecardMetric(participantId, 'clients', String(year1Clients));
  if (year1Referrals) saveVentureScorecardMetric(participantId, 'referrals', String(year1Referrals));
  if (year1Rev) saveVentureScorecardMetric(participantId, 'revenue', String(year1Rev));
  if (monthlyRev > 0) {
    saveVentureScorecardMetric(participantId, 'conversion', `${canvasState.weeklyTargets.newClients || 0} clients/wk`);
  }

  createPortfolioArtifactDraft({
    participantId,
    sectionId: 'portfolio-advisor-startup',
    title: 'Business Engine → FEC Growth & Financial Engines',
    content: formatFecEngineArtifact(draft, canvasState),
    sourceType: 'business_engine_fec_engines',
    sourceId: 'week-3-day-3',
  });

  appendBlueprintTimelineEvent(participantId, {
    type: 'business_engine_fec_engines',
    title: 'FEC Growth & Financial Engines updated',
    detail: `Submitted from Business Engine Canvas · Year 1 ${fmtPeso(year1Rev || monthlyRev * 12)}`,
  });

  saveBecFecEngineDraft(participantId, {
    ...draft,
    submittedAt: new Date().toISOString(),
  });
}

/** @param {BecFecEngineDraft} draft @param {import('./types.js').BusinessEngineCanvasState} state */
function formatFecEngineArtifact(draft, state) {
  return [
    '# Business Engine → FEC Engines',
    '',
    '## Growth Engines (Box 6)',
    '### Advisor Excellence',
    draft.advisorExcellence,
    '',
    '### Team & Leadership',
    draft.teamLeadership,
    '',
    '### Systems & Scale',
    draft.systemsScale,
    '',
    '## Financial Engine (Box 8)',
    '### Revenue Model',
    draft.revenueModel,
    '',
    '### Economics',
    draft.economics,
    '',
    '### Sustainability',
    draft.sustainability,
    '',
    '## Source figures',
    `- Weekly revenue: ${fmtPeso(state.weeklyTargets.revenue)}`,
    `- Monthly revenue: ${fmtPeso(state.monthlyTargets.revenue)}`,
    `- Year 1 commitment: ${fmtPeso(state.reflections.year1RevenueGoal || state.year1Targets.revenue)}`,
  ].join('\n');
}
