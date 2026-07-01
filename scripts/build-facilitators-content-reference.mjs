#!/usr/bin/env node
/**
 * Builds content/facilitators-content-reference.json from Week 1 published content
 * plus drafted Weeks 2–4 outlines.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DRAFT_WEEKS } from './facilitators-reference-weeks-2-4.mjs';

const ROOT = process.cwd();
const OUT = join(ROOT, 'content/facilitators-content-reference.json');

function loadJson(rel) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

function excerpt(text, max = 220) {
  if (!text || typeof text !== 'string') return '';
  const one = text.replace(/\s+/g, ' ').trim();
  return one.length <= max ? one : `${one.slice(0, max)}…`;
}

function mapSlides(slides = []) {
  return slides.map((s, i) => ({
    number: s.sortOrder ?? i + 1,
    title: s.title || `Slide ${i + 1}`,
    summary: excerpt(s.body),
    facilitatorNotes: excerpt(s.speakerNotes, 400),
    discussionQuestions: s.discussionQuestions ?? [],
    imageUrl: s.imageUrl ?? null,
  }));
}

function mapDeck(presentationJson, deckKey = 'presentation') {
  if (!presentationJson?.presentation) return null;
  const pres = presentationJson.presentation;
  return {
    id: pres.id,
    title: pres.title,
    purpose: pres.subtitle || pres.description || '',
    slideCount: presentationJson.slides?.length ?? 0,
    status: 'published',
    pptxUrl: pres.pptxUrl ?? null,
    pdfUrl: pres.pdfUrl ?? null,
    slides: mapSlides(presentationJson.slides),
  };
}

function mapActivities(activitiesJson) {
  return (activitiesJson?.activities ?? []).map((a) => ({
    title: a.title,
    durationMinutes: a.durationMinutes,
    instructions: a.instructions ?? [],
    materials: a.materials ?? [],
    outputs: a.outputs ?? [],
    debriefQuestions: a.debriefQuestions ?? [],
  }));
}

function mapSessions(sessionsJson) {
  return (sessionsJson?.sessions ?? []).map((s) => ({
    sessionNumber: s.sessionNumber,
    title: s.title,
    durationMinutes: s.durationMinutes,
    presentationIds: s.presentationIds ?? [],
    activityIds: s.activityIds ?? [],
    worksheetIds: s.worksheetIds ?? [],
    assessmentIds: s.assessmentIds ?? [],
    reflectionIds: s.reflectionIds ?? [],
    surveyIds: s.surveyIds ?? [],
  }));
}

function mapListItems(json, key, field = 'title') {
  const rows = json?.[key] ?? [];
  return rows.map((r) => r[field] ?? r.id ?? '').filter(Boolean);
}

function extractPublishedDay(weekNum, dayNum) {
  const base = `content/segment-1/week-${weekNum}/day-${dayNum}`;
  const day = loadJson(`${base}/day.json`);
  if (!day) return null;

  const deck01 = loadJson(`${base}/presentation.json`);
  const deck02 = loadJson(`${base}/presentation-deck-02.json`);
  const facilitator = loadJson(`${base}/facilitator-guide.json`);
  const mentor = loadJson(`${base}/mentor-guide.json`);
  const activities = loadJson(`${base}/activities.json`);
  const sessions = loadJson(`${base}/sessions.json`);
  const worksheets = loadJson(`${base}/worksheets.json`);
  const assessments = loadJson(`${base}/assessment.json`);
  const reflections = loadJson(`${base}/reflections.json`);
  const surveys = loadJson(`${base}/survey.json`);
  const evaluations = loadJson(`${base}/evaluations.json`);

  const decks = [mapDeck(deck01), mapDeck(deck02)]
    .filter(Boolean)
    .filter((d) => (day?.presentations ?? []).includes(d.id));
  const hasPublishedDeck = decks.some((d) => d.pdfUrl || d.pptxUrl || d.slides?.some((s) => s.imageUrl));

  return {
    dayNumber: dayNum,
    programDay: weekNum === 1 ? dayNum : (weekNum - 1) * 5 + dayNum,
    dayId: day?.id ?? `day-segment-1-week-${weekNum}-day-${dayNum}`,
    title: day?.title ?? `Week ${weekNum} Day ${dayNum}`,
    theme: day?.theme ?? facilitator?.title?.split('—')[1]?.trim() ?? '',
    durationHours: facilitator?.durationHours ?? day?.durationHours ?? 4,
    status: hasPublishedDeck ? 'published' : 'draft',
    contentPath: `/content/segment-1/week-${weekNum}/day-${dayNum}`,
    playbookPath: `/playbook?segment=1&week=${weekNum}&day=${dayNum}`,
    learningObjectives: day?.learningObjectives ?? [],
    decks,
    sessions: mapSessions(sessions),
    sessionFlow: facilitator?.sessionFlow ?? [],
    activities: mapActivities(activities),
    worksheets: mapListItems(worksheets, 'worksheets'),
    assessments: mapListItems(assessments, 'assessments'),
    reflections: mapListItems(reflections, 'reflections'),
    surveys: mapListItems(surveys, 'surveys'),
    evaluations: mapListItems(evaluations, 'evaluations'),
    prepChecklist: facilitator?.prepChecklist ?? [],
    debriefQuestions: facilitator?.debriefQuestions ?? [],
    commonPitfalls: facilitator?.commonPitfalls ?? [],
    coachingTips: facilitator?.coachingTips ?? [],
    mentorGuide: mentor
      ? {
          theme: mentor.theme,
          title: mentor.title,
          coachingObjective: mentor.coachingObjective,
          timing: mentor.timing,
          discussionQuestions: mentor.discussionQuestions ?? [],
          observationAreas: mentor.observationAreas ?? [],
        }
      : null,
    expectedOutputs: day?.expectedOutputs ?? activities?.activities?.flatMap((a) => a.outputs ?? []) ?? [],
  };
}

function extractWeek1Day(dayNum) {
  return extractPublishedDay(1, dayNum);
}

/** Merge published Playbook days into draft facilitator reference weeks. */
function mergePublishedDaysIntoDraftWeeks(draftWeeks) {
  return draftWeeks.map((week) => {
    const days = week.days.map((draftDay) => {
      const published = extractPublishedDay(week.weekNumber, draftDay.dayNumber);
      if (!published || published.status !== 'published') return draftDay;
      return {
        ...draftDay,
        ...published,
        programDay: published.programDay ?? draftDay.programDay,
      };
    });
    const publishedCount = days.filter((d) => d.status === 'published').length;
    return {
      ...week,
      status: publishedCount === days.length ? 'published' : publishedCount > 0 ? 'partial' : week.status,
      days,
    };
  });
}

const week1Meta = loadJson('content/segment-1/week-1/week.json') ?? {
  title: 'Ambition & Purpose',
  theme: 'Dream • Discover • Decide',
  milestoneObjective: 'Complete Week 1 identity, market discovery, and venture direction for the 40-hour Ambition Review.',
};

const week1 = {
  weekNumber: 1,
  title: week1Meta.title ?? 'Ambition & Purpose',
  theme: week1Meta.theme ?? 'Dream • Discover • Decide',
  hourGate: 40,
  milestoneObjective:
    week1Meta.milestoneObjective
    ?? 'Complete identity builders, industry immersion, market discovery, FE Canvas v1, and Week 1 portfolio presentation.',
  businessPlanChapter: 'Business Plan Chapter 1 — Venture Identity & Direction',
  portfolioSection: 'Portfolio — Identity & Week 1 Journey',
  status: 'published',
  days: [1, 2, 3, 4, 5].map(extractWeek1Day),
};

const document = {
  meta: {
    id: 'facilitators-content-reference',
    title: 'Facilitators Content Reference',
    subtitle: 'Segment 1 — Weeks 1–4: Talks, Decks, Activities & Daily Flow',
    version: '1.0.0',
    updatedAt: new Date().toISOString().slice(0, 10),
    audience: ['Program Coach', 'Admin', 'Super Admin', 'Mentor'],
    segment: 'Segment 1: SPIKE Core Internship (Hours 1–160 gate)',
    purpose:
      'Single staff reference for every program day: presentation decks (Deck 01 & Deck 02), session flow, activities, assessments, mentor coaching focus, and gate milestones. Week 1 is synced from published Playbook content; Weeks 2–4 are facilitator drafts until Content Studio publish.',
    hourGates: [
      { hours: 40, week: 1, label: 'Ambition Review' },
      { hours: 80, week: 2, label: 'Market Review' },
      { hours: 120, week: 3, label: 'Business Operations Review' },
      { hours: 160, week: 4, label: 'Professional Readiness Gate' },
    ],
  },
  weeks: [week1, ...mergePublishedDaysIntoDraftWeeks(DRAFT_WEEKS)],
};

writeFileSync(OUT, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
console.log(`Wrote ${OUT} (${document.weeks.length} weeks, ${document.weeks.reduce((n, w) => n + w.days.length, 0)} days)`);
