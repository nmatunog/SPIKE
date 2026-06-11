#!/usr/bin/env node
/**
 * Smoke test — Mentor Week 1 framework constants and seed (no browser).
 */
import {
  MENTOR_PHILOSOPHY,
  WEEK1_ASSESSMENT_CATEGORIES,
  WEEK1_DAY_META,
  WEEK1_MENTOR_OUTCOMES,
} from '../src/lib/mentorWeek1Constants.js';
import { getMentorDayFromSeed, MENTOR_DAY_GUIDES_SEED } from '../src/lib/facultyMentorFrameworkSeed.js';

function fail(message) {
  console.error(`smoke:mentor-week1 FAIL — ${message}`);
  process.exit(1);
}

if (!MENTOR_PHILOSOPHY.includes('coach')) fail('mentor philosophy missing');
if (WEEK1_MENTOR_OUTCOMES.length < 9) fail('week 1 outcomes incomplete');
if (WEEK1_DAY_META.length !== 5) fail('expected 5 week 1 day meta entries');
if (WEEK1_ASSESSMENT_CATEGORIES.length !== 5) fail('expected 5 assessment categories');
if (MENTOR_DAY_GUIDES_SEED.length !== 5) fail('expected 5 mentor day guides');

const day1 = getMentorDayFromSeed(1, 1, 1);
if (!day1?.theme || day1.theme !== 'Identity') fail('day 1 theme missing');
if (!day1.discussion_questions?.some((q) => /SPIKE/i.test(String(q)))) fail('day 1 spec question missing');
if (!day1.observation_areas?.includes('Confidence')) fail('day 1 observation areas missing');
if (!day1.expected_outcomes?.includes('Participant Snapshot')) fail('day 1 expected output missing');

const day5 = getMentorDayFromSeed(1, 1, 5);
if (day5?.theme !== 'Commitment') fail('day 5 theme missing');
if (!day5.expected_outcomes?.includes('Week 1 Coaching Summary')) fail('day 5 expected output missing');

console.log('smoke:mentor-week1 OK');
console.log(`  guides: ${MENTOR_DAY_GUIDES_SEED.length} days`);
console.log(`  day 1: ${day1.theme} — ${day1.coaching_objective}`);
console.log(`  assessments: ${WEEK1_ASSESSMENT_CATEGORIES.map((c) => c.label).join(', ')}`);
