#!/usr/bin/env node
/**
 * Smoke test — Faculty Week 1 framework constants and seed (no browser).
 */
import {
  FACULTY_PHILOSOPHY,
  WEEK1_FACULTY_DAY_META,
  WEEK1_FACULTY_OUTCOMES,
  WEEK1_FACULTY_THEME,
} from '../src/lib/facultyWeek1Constants.js';
import { FACULTY_DAY_TEMPLATES_SEED, getFacultyDayFromSeed } from '../src/lib/facultyMentorFrameworkSeed.js';
import { ROUTES, canonicalizePathname } from '../src/routes/paths.js';

function fail(message) {
  console.error(`smoke:faculty-week1 FAIL — ${message}`);
  process.exit(1);
}

if (!FACULTY_PHILOSOPHY.includes('deliver content')) fail('program coach philosophy missing');
if (WEEK1_FACULTY_THEME !== 'Dream • Discover • Decide') fail('week theme missing');
if (WEEK1_FACULTY_OUTCOMES.length < 8) fail('faculty outcomes incomplete');
if (WEEK1_FACULTY_DAY_META.length !== 5) fail('expected 5 faculty day meta entries');
if (FACULTY_DAY_TEMPLATES_SEED.length !== 5) fail('expected 5 faculty day templates');

const day1 = getFacultyDayFromSeed(1, 1, 1);
if (!day1?.theme || !day1.learning_objectives?.length) fail('day 1 template missing');
if (!day1.expected_outputs?.includes('Ambition')) fail('day 1 expected output missing');
if (!day1.rubrics?.length) fail('day 1 rubrics missing');

const day5 = getFacultyDayFromSeed(1, 1, 5);
if (day5?.theme !== 'Commitment') fail('day 5 theme missing');
if (!day5.expected_outputs?.some((o) => /Portfolio/i.test(String(o)))) fail('day 5 portfolio output missing');

const metaDay3 = WEEK1_FACULTY_DAY_META.find((m) => m.day === 3);
if (metaDay3?.theme !== 'Customer') fail('day 3 meta theme missing');

if (ROUTES.programCoachHome !== '/program-coach') fail('program coach home route missing');
if (canonicalizePathname('/faculty') !== ROUTES.programCoachHome) fail('legacy /faculty redirect missing');
if (canonicalizePathname('/faculty/playbook/1/1/2') !== `${ROUTES.programCoachPlaybook}/1/1/2`) {
  fail('legacy faculty playbook redirect missing');
}
if (canonicalizePathname('/admin/faculty-playbook') !== ROUTES.adminProgramCoachPlaybook) {
  fail('legacy admin faculty playbook redirect missing');
}
if (canonicalizePathname('/admin/content-studio/faculty-guides') !== ROUTES.programCoachGuides) {
  fail('legacy faculty guides redirect missing');
}

console.log('smoke:faculty-week1 OK');
console.log(`  templates: ${FACULTY_DAY_TEMPLATES_SEED.length} days`);
console.log(`  day 1: ${day1.theme}`);
console.log(`  outcomes: ${WEEK1_FACULTY_OUTCOMES.length}`);
