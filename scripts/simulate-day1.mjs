#!/usr/bin/env node
/**
 * Day 1 complete simulation — validates faculty delivery content (Phase 1).
 * Simulates: 1 faculty, 1 mentor, 5 participants walking Day 1 content tree.
 */
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const ROLES = {
  faculty: { name: 'Faculty Coach Reyes', id: 'sim-faculty-1' },
  mentor: { name: 'Mentor Santos', id: 'sim-mentor-1' },
  participants: [
    { name: 'Participant A', id: 'sim-p1' },
    { name: 'Participant B', id: 'sim-p2' },
    { name: 'Participant C', id: 'sim-p3' },
    { name: 'Participant D', id: 'sim-p4' },
    { name: 'Participant E', id: 'sim-p5' },
  ],
};

function fail(message) {
  console.error(`simulate:day1 FAIL — ${message}`);
  process.exit(1);
}

function log(section, detail) {
  console.log(`  [${section}] ${detail}`);
}

const server = await createServer({ root, server: { middlewareMode: true }, logLevel: 'error' });

try {
  const mod = await server.ssrLoadModule('/src/lib/curriculumService.js');
  const bundle = mod.assertSegment1Week1Day1Ready();

  console.log('simulate:day1 — Week 1 Day 1 pilot simulation');
  console.log(`  Faculty: ${ROLES.faculty.name}`);
  console.log(`  Mentor: ${ROLES.mentor.name}`);
  console.log(`  Participants: ${ROLES.participants.length}`);
  console.log('');

  // Faculty Deck 01
  const deck01 = bundle.presentation;
  if (deck01.presentation.id !== 'presentation-day-1-deck-01') {
    fail('Faculty Deck 01 missing');
  }
  log('Faculty Deck 01', `${deck01.presentation.title} — ${deck01.slides.length} slides`);
  const deck01Stories = ['AIA Story', 'Agency Story', 'SPIKE Story'];
  for (const story of deck01Stories) {
    if (!deck01.slides.some((s) => s.title.includes(story))) {
      fail(`Deck 01 missing slide: ${story}`);
    }
  }
  for (const slide of deck01.slides) {
    if (!slide.speakerNotes?.trim()) fail(`Deck 01 slide "${slide.title}" missing speaker notes`);
  }

  // Faculty Deck 02
  const deck02 = bundle.presentationDeck02;
  if (!deck02?.slides?.length) fail('Faculty Deck 02 missing');
  log('Faculty Deck 02', `${deck02.presentation.title} — ${deck02.slides.length} slides`);
  const pillars = ['Ambition', 'Impact', 'Values', 'Future Self', 'Career Direction'];
  for (const pillar of pillars) {
    if (!deck02.slides.some((s) => s.title.includes(pillar))) {
      fail(`Deck 02 missing pillar slide: ${pillar}`);
    }
  }
  for (const slide of deck02.slides) {
    if (!slide.speakerNotes?.trim()) fail(`Deck 02 slide "${slide.title}" missing speaker notes`);
  }

  // Activities
  const activities = bundle.activities.activities;
  log('Activities', `${activities.length} activity guides`);
  for (const activity of activities) {
    if (!activity.instructions?.length) fail(`Activity ${activity.id} missing instructions`);
    if (!activity.debriefQuestions?.length) fail(`Activity ${activity.id} missing debrief questions`);
    log('Activity', `${activity.title} (${activity.durationMinutes}m) — ${activity.debriefQuestions.length} debrief Qs`);
  }

  // Evaluations
  const templates = bundle.evaluations.templates;
  log('Evaluations', `${templates.length} Day 1 templates`);
  const hasRubric = templates.some((t) => t.type === 'rubric');
  const hasObservation = templates.some((t) => t.type === 'observation_form');
  if (!hasRubric || !hasObservation) fail('Missing rubric or observation evaluation template');

  // Mentor guide
  if (!bundle.mentorGuide?.coachingObjective) fail('Mentor guide missing');
  log('Mentor Guide', String(bundle.mentorGuide.title));

  // Session flow simulation
  const sessions = bundle.sessions.sessions;
  log('Sessions', `${sessions.length} sessions`);
  for (const session of sessions) {
    log('Session', `${session.sessionNumber}: ${session.title} (${session.durationMinutes}m)`);
    log('  →', `${session.presentationIds.length} decks, ${session.activityIds.length} activities`);
  }

  // Participant walk-through (content availability only)
  console.log('');
  console.log('Participant simulation (content gates):');
  for (const p of ROLES.participants) {
    const steps = [
      'Deck 01 stories',
      'Deck 02 identity',
      ...activities.map((a) => a.title),
      'Portfolio sync',
      'Day 1 reflection',
    ];
    log(p.name, `${steps.length} steps available`);
  }

  console.log('');
  console.log('simulate:day1 OK — Day 1 content complete for pilot');
  console.log(`  Deck 01: ${deck01.slides.length} slides · Deck 02: ${deck02.slides.length} slides`);
  console.log(`  Activities: ${activities.length} · Evaluations: ${templates.length} · Sessions: ${sessions.length}`);
} catch (error) {
  fail(error.message);
} finally {
  await server.close();
}
