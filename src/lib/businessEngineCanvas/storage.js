import { BEC_STORAGE_KEY, ENGINE_STEPS, WEEKLY_METRICS, MONTHLY_METRICS } from './constants.js';
import { cascadeFromProspects, weeklyToMonthly } from './funnel.js';

function readAll() {
  try {
    const raw = localStorage.getItem(BEC_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(BEC_STORAGE_KEY, JSON.stringify(data));
}

/** @returns {import('./types.js').BusinessEngineCanvasState} */
export function defaultBusinessEngineCanvasState() {
  /** @type {Record<string, import('./types.js').EngineStepValue>} */
  const activityEngine = {};
  for (const step of ENGINE_STEPS) {
    activityEngine[step.id] = { value: step.defaultValue, label: step.defaultLabel };
  }

  const cascaded = cascadeFromProspects(10, activityEngine.revenue.value);
  /** @type {Record<string, number | string>} */
  const weeklyTargets = {};
  weeklyTargets.prospects = cascaded.prospects;
  weeklyTargets.discoveryConversations = cascaded.discovery;
  weeklyTargets.solutionPresentations = cascaded.presentations;
  weeklyTargets.newClients = cascaded.clients;
  weeklyTargets.revenue = cascaded.revenue;
  weeklyTargets.referrals = cascaded.referrals;

  const monthlyTargets = weeklyToMonthly(weeklyTargets);
  /** @type {Record<string, boolean>} */
  const monthlyManualOverride = {};
  for (const m of MONTHLY_METRICS) monthlyManualOverride[m.id] = false;

  return {
    week: 3,
    activityEngine,
    weeklyTargets,
    monthlyTargets,
    monthlyManualOverride,
    year1Targets: {
      newClients: '',
      revenue: '',
      referrals: '',
      clientReviews: '',
    },
    businessLever: null,
    growthSimulation: {
      current: {
        prospects: cascaded.prospects,
        discovery: cascaded.discovery,
        presentations: cascaded.presentations,
        clients: cascaded.clients,
        revenue: cascaded.revenue,
        referrals: cascaded.referrals,
      },
      new: {
        prospects: cascaded.prospects * 2,
        discovery: cascaded.discovery * 2,
        presentations: cascaded.presentations * 2,
        clients: cascaded.clients * 2,
        revenue: cascaded.revenue * 2,
        referrals: cascaded.referrals * 2,
      },
    },
    reflections: {
      engineProducesBusiness: '',
      biggestWeakness: '',
      firstImprovement: '',
      year1RevenueGoal: '',
    },
    updatedAt: null,
    createdAt: null,
  };
}

/** Blank template for coach/mentor presentation — model defaults in engine, empty participant fields. */
export function blankBusinessEngineCanvasState() {
  const base = defaultBusinessEngineCanvasState();
  /** @type {Record<string, number | string>} */
  const emptyWeekly = {};
  for (const key of Object.keys(base.weeklyTargets)) emptyWeekly[key] = '';

  /** @type {Record<string, number | string>} */
  const emptyMonthly = {};
  for (const key of Object.keys(base.monthlyTargets)) emptyMonthly[key] = '';

  /** @type {Record<string, boolean>} */
  const noOverride = {};
  for (const key of Object.keys(base.monthlyManualOverride)) noOverride[key] = false;

  return {
    ...base,
    weeklyTargets: emptyWeekly,
    monthlyTargets: emptyMonthly,
    monthlyManualOverride: noOverride,
    year1Targets: {
      newClients: '',
      revenue: '',
      referrals: '',
      clientReviews: '',
    },
    businessLever: null,
    growthSimulation: {
      current: { ...base.growthSimulation.current },
      new: {
        prospects: '',
        discovery: '',
        presentations: '',
        clients: '',
        revenue: '',
        referrals: '',
      },
    },
    reflections: {
      engineProducesBusiness: '',
      biggestWeakness: '',
      firstImprovement: '',
      year1RevenueGoal: '',
    },
  };
}

/** @param {string} participantId */
export function loadBusinessEngineCanvas(participantId) {
  if (!participantId) return defaultBusinessEngineCanvasState();
  const row = readAll()[participantId];
  if (!row) return defaultBusinessEngineCanvasState();
  return {
    ...defaultBusinessEngineCanvasState(),
    ...row,
    activityEngine: { ...defaultBusinessEngineCanvasState().activityEngine, ...(row.activityEngine ?? {}) },
    weeklyTargets: { ...defaultBusinessEngineCanvasState().weeklyTargets, ...(row.weeklyTargets ?? {}) },
    monthlyTargets: { ...defaultBusinessEngineCanvasState().monthlyTargets, ...(row.monthlyTargets ?? {}) },
    monthlyManualOverride: {
      ...defaultBusinessEngineCanvasState().monthlyManualOverride,
      ...(row.monthlyManualOverride ?? {}),
    },
    year1Targets: { ...defaultBusinessEngineCanvasState().year1Targets, ...(row.year1Targets ?? {}) },
    growthSimulation: {
      current: {
        ...defaultBusinessEngineCanvasState().growthSimulation.current,
        ...(row.growthSimulation?.current ?? {}),
      },
      new: {
        ...defaultBusinessEngineCanvasState().growthSimulation.new,
        ...(row.growthSimulation?.new ?? {}),
      },
    },
    reflections: { ...defaultBusinessEngineCanvasState().reflections, ...(row.reflections ?? {}) },
  };
}

/**
 * @param {string} participantId
 * @param {import('./types.js').BusinessEngineCanvasState} state
 */
export function saveBusinessEngineCanvas(participantId, state) {
  if (!participantId) return state;
  const all = readAll();
  const now = new Date().toISOString();
  const next = {
    ...state,
    updatedAt: now,
    createdAt: state.createdAt ?? all[participantId]?.createdAt ?? now,
  };
  all[participantId] = next;
  writeAll(all);
  return next;
}

/** @param {import('./types.js').BusinessEngineCanvasState} state */
export function computeBusinessEngineProgress(state) {
  let filled = 0;
  let total = 0;

  const check = (val, minLen = 1) => {
    total += 1;
    const text = String(val ?? '').trim();
    if (typeof val === 'number' && val > 0) filled += 1;
    else if (text.length >= minLen) filled += 1;
  };

  for (const step of ENGINE_STEPS) {
    check(state.activityEngine[step.id]?.value);
  }
  for (const m of WEEKLY_METRICS) check(state.weeklyTargets[m.id]);
  for (const m of MONTHLY_METRICS) check(state.monthlyTargets[m.id]);
  check(state.reflections.engineProducesBusiness, 10);
  for (const k of Object.keys(state.year1Targets)) check(state.year1Targets[k]);
  check(state.businessLever);
  for (const k of Object.keys(state.growthSimulation.new)) check(state.growthSimulation.new[k]);
  check(state.reflections.biggestWeakness, 10);
  check(state.reflections.firstImprovement, 10);
  check(state.reflections.year1RevenueGoal);

  return total ? Math.round((filled / total) * 100) : 0;
}
