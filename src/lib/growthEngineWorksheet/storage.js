import { GEW_STORAGE_KEY } from './types.js';
import { loadBusinessEngineCanvas } from '../businessEngineCanvas/storage.js';
import {
  FUNNEL_ENGINE_VERSION,
  hasLegacyTwoThirdsClientFunnel,
  recalculateGrowthTargets,
  repairGrowthEngineFunnelTargets,
} from './calculations.js';

/** @returns {import('./types.js').GrowthEngineWorksheetState} */
export function defaultGrowthEngineWorksheetState(participantId = '') {
  const bec = participantId ? loadBusinessEngineCanvas(participantId) : null;
  const yearRev = bec?.year1Targets?.revenue ?? bec?.reflections?.year1RevenueGoal ?? '';
  const avgRev = bec?.activityEngine?.revenue?.value ?? 10000;

  return {
    week: 3,
    day: 4,
    openingBiggestInsight: '',
    openingBiggestSurprise: '',
    openingOneImprovement: '',
    capacityLimitReflection: '',
    capacityVsActivitySide: '',
    developLeaders: '',
    buildSystems: '',
    increaseCapacity: '',
    expandMarket: '',
    longTermVision: '',
    targets: {
      yearRevenueGoal: yearRev,
      averageRevenuePerClient: avgRev,
      requiredClients: '',
      monthlyTargets: {},
      weeklyTargets: {},
    },
    engineAchievesTarget: null,
    engineChangeIfNo: '',
    growthStrategy: '',
    growthStrategyOther: '',
    growthStrategyReflection: '',
    fecYear1Launch: '',
    fecYear2Expand: '',
    fecYear3Multiply: '',
    pitchClientExperience: false,
    pitchWinningStrategy: false,
    pitchBusinessEngine: false,
    pitchGrowthEngine: false,
    pitchRevenueTargets: false,
    pitchCapacityPlan: false,
    mentorStatus: null,
    mentorFeedback: '',
    completed: false,
    funnelEngineVersion: FUNNEL_ENGINE_VERSION,
    updatedAt: null,
    createdAt: null,
  };
}

function readAll() {
  try {
    const raw = localStorage.getItem(GEW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(GEW_STORAGE_KEY, JSON.stringify(data));
}

/** @param {string} participantId @returns {import('./types.js').GrowthEngineWorksheetState} */
export function loadGrowthEngineWorksheet(participantId) {
  if (!participantId) return defaultGrowthEngineWorksheetState();
  const all = readAll();
  const row = all[participantId];
  if (!row) return defaultGrowthEngineWorksheetState(participantId);
  const merged = {
    ...defaultGrowthEngineWorksheetState(participantId),
    ...row,
    targets: {
      ...defaultGrowthEngineWorksheetState(participantId).targets,
      ...(row.targets ?? {}),
    },
  };
  if (
    merged.targets.yearRevenueGoal
    && merged.targets.averageRevenuePerClient
    && !merged.targets.requiredClients
  ) {
    merged.targets = recalculateGrowthTargets(merged.targets);
  }

  const legacyFunnel = hasLegacyTwoThirdsClientFunnel(merged.targets?.weeklyTargets);
  const needsFunnelMigration =
    legacyFunnel || (merged.funnelEngineVersion ?? 1) < FUNNEL_ENGINE_VERSION;

  if (needsFunnelMigration) {
    merged.targets = repairGrowthEngineFunnelTargets(merged.targets);
    merged.funnelEngineVersion = FUNNEL_ENGINE_VERSION;
    all[participantId] = {
      ...merged,
      updatedAt: new Date().toISOString(),
      createdAt: merged.createdAt ?? new Date().toISOString(),
    };
    writeAll(all);
  }

  return merged;
}

/** @param {string} participantId @param {import('./types.js').GrowthEngineWorksheetState} state */
export function saveGrowthEngineWorksheet(participantId, state) {
  if (!participantId) return state;
  const all = readAll();
  const now = new Date().toISOString();
  const next = {
    ...state,
    funnelEngineVersion: state.funnelEngineVersion ?? FUNNEL_ENGINE_VERSION,
    updatedAt: now,
    createdAt: state.createdAt ?? now,
  };
  all[participantId] = next;
  writeAll(all);
  return next;
}

/** @param {import('./types.js').GrowthEngineWorksheetState} state */
export function computeGrowthEngineProgress(state) {
  const fields = [
    state.openingBiggestInsight,
    state.openingBiggestSurprise,
    state.openingOneImprovement,
    state.capacityLimitReflection,
    state.capacityVsActivitySide,
    state.developLeaders,
    state.buildSystems,
    state.increaseCapacity,
    state.expandMarket,
    state.longTermVision,
    state.targets.yearRevenueGoal,
    state.targets.averageRevenuePerClient,
    state.targets.requiredClients,
    state.growthStrategy,
    state.growthStrategyReflection,
    state.fecYear1Launch,
    state.fecYear2Expand,
    state.fecYear3Multiply,
  ];
  const filled = fields.filter((v) => {
    if (typeof v === 'string') return v.trim().length >= 10;
    return Boolean(v);
  }).length;
  const pitchChecks = [
    state.pitchClientExperience,
    state.pitchWinningStrategy,
    state.pitchBusinessEngine,
    state.pitchGrowthEngine,
    state.pitchRevenueTargets,
    state.pitchCapacityPlan,
  ].filter(Boolean).length;
  const total = fields.length + 6;
  return Math.round(((filled + pitchChecks) / total) * 100);
}

/** @param {import('./types.js').GrowthEngineWorksheetState} state */
export function isGrowthEngineWorksheetComplete(state) {
  return computeGrowthEngineProgress(state) >= 85
    && Boolean(state.targets.requiredClients)
    && state.fecYear1Launch.trim().length >= 20
    && state.fecYear2Expand.trim().length >= 20
    && state.fecYear3Multiply.trim().length >= 20;
}
