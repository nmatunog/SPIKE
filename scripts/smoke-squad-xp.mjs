#!/usr/bin/env node
/**
 * Smoke test — Squad Weekly XP (auto 80% + mentor 20%).
 */
import assert from 'node:assert/strict';

/** @type {Record<string, string>} */
const store = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => {
    store[k] = String(v);
  },
  removeItem: (k) => {
    delete store[k];
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
  key: () => null,
  length: 0,
};

const participantA = 'squad-xp-a';
const participantB = 'squad-xp-b';
const squadName = 'Cassiopeia';
const memberIds = [participantA, participantB];

const { saveWeek2Discovery } = await import('../src/lib/customerDiscovery/week2DiscoveryStorage.js');
const {
  computeSquadAutoXp,
  computeMentorBonusXp,
  getSquadWeeklyXp,
  rankSquadsByXp,
  saveSquadMentorReview,
  saveSquadStageGateDecision,
  generateSquadCoachingSummary,
} = await import('../src/lib/staff/squadXpService.js');

saveWeek2Discovery(participantA, {
  missionAcknowledged: true,
  guideCompletedAt: new Date().toISOString(),
  portfolioSyncedAt: new Date().toISOString(),
  thinkingShifts: [{ response: 'I changed my thinking about pricing.' }],
  interviews: [{ encoded: true }, { encoded: true }, { encoded: true }],
});
saveWeek2Discovery(participantB, {
  missionAcknowledged: true,
  guideCompletedAt: new Date().toISOString(),
  portfolioSyncedAt: new Date().toISOString(),
  thinkingShifts: [{ response: 'Customers care more about trust than features.' }],
  interviews: [{ encoded: true }, { encoded: true }, { encoded: true }],
});

const auto = computeSquadAutoXp(memberIds, 2);
assert.ok(auto.autoXp > 0, 'auto XP should be positive');
assert.ok(auto.autoXp <= 80, 'auto XP capped at 80');

const ratings = {
  quality_of_learning: 5,
  collaboration: 4,
  professionalism: 5,
  readiness_for_stage_gate: 4,
};
assert.equal(computeMentorBonusXp(ratings), 18);

saveSquadMentorReview('mentor-smoke', squadName, 2, {
  ratings,
  aiSummary: generateSquadCoachingSummary(ratings, squadName),
});
saveSquadStageGateDecision('mentor-smoke', squadName, 2, 'ready');

const xp = getSquadWeeklyXp(squadName, memberIds, 2);
assert.ok(xp.totalXp > auto.autoXp, 'mentor bonus increases total XP');
assert.ok(xp.totalXp <= 100, 'total XP capped at 100');
assert.equal(xp.gate?.decision, 'ready');
assert.ok(xp.review?.aiSummary?.includes(squadName));

const ranks = rankSquadsByXp(
  [
    { name: squadName, members: memberIds.map((id) => ({ id })) },
    { name: 'Pegasus', members: [{ id: 'other' }] },
  ],
  2,
);
assert.equal(ranks[0].squadName, squadName);

console.log('smoke:squad-xp OK');
