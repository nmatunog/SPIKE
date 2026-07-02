import { loadGrowthEngineWorksheet, computeGrowthEngineProgress, isGrowthEngineWorksheetComplete } from './growthEngineWorksheet/storage.js';

/** @param {string} participantId */
export function deriveMemberWeek3Day4Signals(participantId) {
  const ws = loadGrowthEngineWorksheet(participantId);
  const progressPct = computeGrowthEngineProgress(ws);
  const reflectionQuality = [
    ws.openingBiggestInsight,
    ws.capacityLimitReflection,
    ws.growthStrategyReflection,
  ].filter((t) => t.trim().length >= 30).length;

  return {
    progressPct,
    complete: isGrowthEngineWorksheetComplete(ws),
    yearRevenueGoal: Number(ws.targets.yearRevenueGoal) || 0,
    requiredClients: Number(ws.targets.requiredClients) || 0,
    growthStrategy: ws.growthStrategy || '',
    fecSynced: Boolean(ws.fecYear1Launch.trim() && ws.fecYear2Expand.trim() && ws.fecYear3Multiply.trim()),
    pitchChecklistDone: [
      ws.pitchClientExperience,
      ws.pitchWinningStrategy,
      ws.pitchBusinessEngine,
      ws.pitchGrowthEngine,
      ws.pitchRevenueTargets,
      ws.pitchCapacityPlan,
    ].every(Boolean),
    reflectionQuality,
    mentorStatus: ws.mentorStatus ?? '',
    missingFields: deriveMissingFields(ws),
  };
}

/** @param {import('./types.js').GrowthEngineWorksheetState} ws */
function deriveMissingFields(ws) {
  /** @type {string[]} */
  const missing = [];
  if (!ws.developLeaders.trim()) missing.push('Develop Leaders');
  if (!ws.buildSystems.trim()) missing.push('Build Systems');
  if (!ws.targets.yearRevenueGoal) missing.push('Year 1 Revenue Goal');
  if (!ws.targets.requiredClients) missing.push('Required Clients');
  if (!ws.fecYear1Launch.trim()) missing.push('FEC Year 1');
  if (!ws.growthStrategy) missing.push('Growth Strategy');
  return missing;
}

/** @param {string[]} memberIds */
export function deriveSquadWeek3Day4Progress(memberIds) {
  const ids = memberIds.filter(Boolean);
  if (!ids.length) {
    return {
      memberCount: 0,
      avgProgressPct: 0,
      allComplete: false,
      avgRevenueGoal: 0,
      members: [],
    };
  }

  const members = ids.map((id) => ({
    participantId: id,
    ...deriveMemberWeek3Day4Signals(id),
  }));

  return {
    memberCount: ids.length,
    avgProgressPct: Math.round(
      members.reduce((sum, m) => sum + m.progressPct, 0) / members.length,
    ),
    allComplete: members.every((m) => m.complete),
    avgRevenueGoal: Math.round(
      members.reduce((sum, m) => sum + m.yearRevenueGoal, 0) / members.length,
    ),
    members,
  };
}
