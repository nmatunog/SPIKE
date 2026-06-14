#!/usr/bin/env node
/**
 * Filesystem smoke check for Sprint 02 content tree (runs without Vite).
 * Validates JSON structure for Segment 1 / Week 1 / Day 1.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DAY_DIR = join(ROOT, 'content/segment-1/week-1/day-1');

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

for (const file of REQUIRED) {
  const path = join(DAY_DIR, file);
  if (!existsSync(path)) {
    console.error(`smoke:content FAIL — missing ${path}`);
    process.exit(1);
  }
}

const day = JSON.parse(readFileSync(join(DAY_DIR, 'day.json'), 'utf8'));
const presentation = JSON.parse(readFileSync(join(DAY_DIR, 'presentation.json'), 'utf8'));
const deck02 = JSON.parse(readFileSync(join(DAY_DIR, 'presentation-deck-02.json'), 'utf8'));
const activities = JSON.parse(readFileSync(join(DAY_DIR, 'activities.json'), 'utf8'));
const evaluations = JSON.parse(readFileSync(join(DAY_DIR, 'evaluations.json'), 'utf8'));
const mentorGuide = JSON.parse(readFileSync(join(DAY_DIR, 'mentor-guide.json'), 'utf8'));
const contributions = JSON.parse(readFileSync(join(DAY_DIR, 'contributions.json'), 'utf8'));

const checks = [
  [day.learningObjectives?.length > 0, 'learningObjectives'],
  [day.presentations?.length === 2, 'day.presentations (2 decks)'],
  [presentation.presentation?.id === 'presentation-day-1-deck-01', 'Faculty Deck 01 id'],
  [presentation.slides?.length >= 6, 'Deck 01 slides (min 6)'],
  [presentation.presentation?.pptxUrl?.includes('faculty-deck-01.pptx'), 'Deck 01 pptxUrl'],
  [presentation.slides?.every((s) => s.imageUrl), 'Deck 01 slide images'],
  [existsSync(join(ROOT, 'public/content/segment-1/week-1/day-1/faculty-deck-01.pptx')), 'Deck 01 pptx on disk'],
  [deck02.slides?.length >= 7, 'Deck 02 slides'],
  [activities.activities?.length >= 8, 'activity guides'],
  [activities.activities?.every((a) => a.debriefQuestions?.length > 0), 'activity debriefs'],
  [evaluations.templates?.length >= 4, 'evaluation templates'],
  [mentorGuide.coachingObjective, 'mentor guide'],
  [contributions.contributesToPortfolio?.length > 0, 'contributions.contributesToPortfolio'],
  [contributions.contributesToBusinessPlan?.length > 0, 'contributions.contributesToBusinessPlan'],
  [contributions.contributesToCompetencies?.length > 0, 'contributions.contributesToCompetencies'],
];

for (const [ok, label] of checks) {
  if (!ok) {
    console.error(`smoke:content FAIL — invalid ${label}`);
    process.exit(1);
  }
}

console.log('smoke:content OK — Segment 1 / Week 1 / Day 1 files valid');
