#!/usr/bin/env node
/**
 * Smoke test — Week 1 Days 1–5 content files on disk (no Vite).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'content', 'segment-1', 'week-1');
const DAYS = ['day-1', 'day-2', 'day-3', 'day-4', 'day-5'];

const REQUIRED = [
  'day.json',
  'presentation.json',
  'presentation-deck-02.json',
  'activities.json',
  'worksheets.json',
  'assessment.json',
  'survey.json',
  'contributions.json',
  'evaluations.json',
  'mentor-guide.json',
  'facilitator-guide.json',
  'sessions.json',
  'reflections.json',
];

function fail(message) {
  console.error(`smoke:week1-content FAIL — ${message}`);
  process.exit(1);
}

for (const daySlug of DAYS) {
  const dir = join(ROOT, daySlug);
  for (const file of REQUIRED) {
    if (!existsSync(join(dir, file))) fail(`${daySlug} missing ${file}`);
  }

  const presentation = JSON.parse(readFileSync(join(dir, 'presentation.json'), 'utf8'));
  const deck02 = JSON.parse(readFileSync(join(dir, 'presentation-deck-02.json'), 'utf8'));
  const activities = JSON.parse(readFileSync(join(dir, 'activities.json'), 'utf8'));
  const evaluations = JSON.parse(readFileSync(join(dir, 'evaluations.json'), 'utf8'));
  const mentor = JSON.parse(readFileSync(join(dir, 'mentor-guide.json'), 'utf8'));

  if (!presentation.slides?.length) fail(`${daySlug} deck 01 empty`);
  if (!deck02.slides?.length) fail(`${daySlug} deck 02 empty`);
  if ((activities.activities?.length ?? 0) < 4) fail(`${daySlug} needs 4+ activities`);
  if (!activities.activities.every((a) => a.debriefQuestions?.length > 0)) {
    fail(`${daySlug} activity missing debrief`);
  }
  if (!presentation.slides.every((s) => s.speakerNotes?.trim())) {
    fail(`${daySlug} deck 01 slide missing speaker notes`);
  }
  if (!deck02.slides.every((s) => s.speakerNotes?.trim())) {
    fail(`${daySlug} deck 02 slide missing speaker notes`);
  }
  if (!evaluations.templates?.length) fail(`${daySlug} missing evaluations`);
  if (!mentor.coachingObjective) fail(`${daySlug} missing mentor guide`);
}

console.log('smoke:week1-content OK — Days 1–5 bundles on disk');
