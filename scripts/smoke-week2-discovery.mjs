#!/usr/bin/env node
/**
 * Smoke test — Week 2 Customer Discovery Phase A-B services.
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

const participantId = 'smoke-week2-participant';

const { defaultWeek2State, saveWeek2Discovery } = await import(
  '../src/lib/customerDiscovery/week2DiscoveryStorage.js'
);
const { computeMisScore, getVentureStatus } = await import(
  '../src/lib/customerDiscovery/week2MisService.js'
);
const { deriveWeek2MissionTrack, getActiveWeek2Task } = await import(
  '../src/lib/customerDiscovery/week2MissionService.js'
);
const { resolveSquadMission, WEEK2_MISSION_TASKS } = await import(
  '../src/lib/customerDiscovery/week2Constants.js'
);
const { computeSquadAutoXp, saveSquadMentorReview } = await import(
  '../src/lib/staff/squadXpService.js'
);

assert.equal(defaultWeek2State().questions.length, 5);
assert.ok(resolveSquadMission('Cassiopeia').marketSegment.includes('Gen Z'));
assert.equal(WEEK2_MISSION_TASKS.length, 3);

saveWeek2Discovery(participantId, { missionAcknowledged: true });
const track = deriveWeek2MissionTrack(participantId);
assert.equal(track[0].complete, true);

const mis = computeMisScore(participantId);
assert.ok(mis >= 0);

const status = getVentureStatus(participantId);
assert.ok(status.nextMilestone);

const active = getActiveWeek2Task(participantId);
assert.ok(['guide', 'thinking'].includes(active.id), `unexpected active task ${active.id}`);

const auto = computeSquadAutoXp([participantId], 2);
assert.ok(auto.autoXp >= 0);

saveSquadMentorReview('mentor-smoke', 'Squad Cassiopeia', 2, {
  ratings: { quality_of_learning: 4, collaboration: 4, professionalism: 4, readiness_for_stage_gate: 3 },
});

console.log('smoke:week2-discovery OK');
