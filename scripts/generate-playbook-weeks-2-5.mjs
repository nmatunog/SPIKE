#!/usr/bin/env node
/**
 * Publish Playbook day bundles for Segment 1 Weeks 2–5 (coaches & mentors).
 * Week 2 Day 1 is preserved (Customer Discovery). Week 5 uses capstone outline.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DRAFT_WEEKS } from './facilitators-reference-weeks-2-4.mjs';

const CONTENT_ROOT = join(import.meta.dirname, '..', 'content', 'segment-1');

/** @param {string} path @param {unknown} data */
function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function deck(title, purpose, slides) {
  return { title, purpose, slideCount: slides.length, slides, status: 'draft' };
}

function flow(blocks) {
  return blocks.map(([time, activity, notes]) => ({ time, activity, notes }));
}

function act(title, minutes, instructions, outputs = [], debrief = []) {
  return { title, durationMinutes: minutes, instructions, outputs, debriefQuestions: debrief };
}

const WEEK_5_DRAFT = {
  weekNumber: 5,
  title: '3-Year Blueprint & Venture Board Prep',
  theme: 'Proof of Concept Capstone',
  businessPlanChapter: 'bp-chapter-5',
  portfolioSection: 'portfolio-three-year-blueprint',
  days: [
    {
      dayNumber: 1,
      title: 'Day 21 — Product Solutions & Needs-Based Framework',
      theme: 'Product Integration',
      learningObjectives: [
        'Connect documented client needs to product solution categories',
        'Compare Trad Life and VUL roles in a protection portfolio',
        'Practice needs-based recommendation language without hard selling',
      ],
      decks: [
        deck('Program Coach Deck 01 — From Discovery to Solutions', 'Bridge Week 4 licensing to product week.', [
          { title: 'Day 21 Opening — Solutions After Evidence', purpose: 'Week 5 launches product integration.' },
          { title: 'Needs-Based Recommendation Framework', purpose: 'Needs first, product second.' },
          { title: 'Trad Life vs VUL — When Each Fits', purpose: 'Conceptual comparison only.' },
          { title: 'Ethical Recommendation Language', purpose: 'No guarantees; full disclosure.' },
          { title: 'Deck 01 Close — Squad Lab Preview', purpose: '' },
        ]),
        deck('Program Coach Deck 02 — Solution Mapping Lab', 'Hands-on mapping.', [
          { title: 'Persona Recap from Portfolio', purpose: 'Pull Week 1–2 persona artifacts.' },
          { title: 'Solution Mapping Worksheet', purpose: 'Map needs to solution types.' },
          { title: 'Squad Peer Review Protocol', purpose: 'Challenge assumptions respectfully.' },
          { title: 'Portfolio Sync — Business Plan Ch. 5', purpose: '' },
          { title: 'Day 21 Deliverables', purpose: '' },
        ]),
      ],
      sessionFlow: flow([
        ['0:00–0:35', 'Deck 01 — Product solutions framing', ''],
        ['0:35–1:25', 'Solution mapping lab', 'Mentors probe for needs evidence.'],
        ['1:25–1:35', 'Break', ''],
        ['1:35–2:15', 'Squad peer review', ''],
        ['2:15–2:45', 'Portfolio sync + assessment', ''],
        ['2:45–3:00', 'Reflection + Day 22 preview', ''],
      ]),
      activities: [
        act('Solution Mapping Lab', 50, ['Map persona needs to solution categories', 'Document rationale'], ['Solution map artifact'], ['What need was hardest to address?']),
        act('Squad Peer Review', 40, ['Review one squad map per team', 'Capture feedback'], ['Peer review notes'], ['Did anyone jump to product too fast?']),
      ],
      worksheets: ['Solution mapping worksheet'],
      assessments: ['Solution mapping rubric'],
      prepChecklist: ['Load persona artifacts from portfolios', 'Brief mentors on compliance language'],
      debriefQuestions: ['Who stayed needs-based longest?', 'Gaps before sales process day?'],
      commonPitfalls: ['Product pitching before needs documented', 'Guarantee language'],
      coachingTips: ['Reward evidence citations from discovery work'],
      mentorGuide: { theme: 'Integration', coachingObjective: 'Connect discovery to ethical recommendations.', observationAreas: ['Needs evidence', 'Language discipline', 'Squad collaboration'] },
      expectedOutputs: ['Solution map artifact', 'Portfolio Chapter 5 draft'],
    },
    {
      dayNumber: 2,
      title: 'Day 22 — Sales Process & Objection Handling',
      theme: 'Advisory Sales',
      learningObjectives: [
        'Outline the SPIKE advisory sales stages from rapport to next step',
        'Practice objection handling with role-play scenarios',
        'Document a personal sales process for Venture Portfolio',
      ],
      decks: [
        deck('Program Coach Deck 01 — Advisory Sales Stages', 'Process over scripts.', [
          { title: 'Day 22 — Ethical Sales as Service', purpose: '' },
          { title: 'Seven-Stage Advisory Flow', purpose: 'Rapport through follow-up.' },
          { title: 'Objection Types & Responses', purpose: 'Feel, felt, found — adapted for SPIKE.' },
          { title: 'Role-Play Rules', purpose: 'Psychological safety.' },
          { title: 'Deck 01 Close', purpose: '' },
        ]),
        deck('Program Coach Deck 02 — Objection Role-Play Lab', '', [
          { title: 'Scenario Assignments', purpose: 'Price, timing, trust objections.' },
          { title: 'Observer Checklist', purpose: 'Mentors score listening, not closing.' },
          { title: 'Debrief Protocol', purpose: '' },
          { title: 'Personal Sales Process Builder', purpose: '' },
          { title: 'Day 22 Deliverables', purpose: '' },
        ]),
      ],
      sessionFlow: flow([
        ['0:00–0:30', 'Deck 01 — Sales stages', ''],
        ['0:30–1:30', 'Objection role-play rounds', ''],
        ['1:30–1:40', 'Break', ''],
        ['1:40–2:20', 'Personal sales process workshop', ''],
        ['2:20–2:45', 'Squad debrief + portfolio sync', ''],
        ['2:45–3:00', 'Reflection', ''],
      ]),
      activities: [
        act('Objection Role-Play Lab', 60, ['Rotate advisor/client/observer', 'Use scenario cards'], ['Role-play feedback sheet'], ['Which objection felt most real?']),
        act('Personal Sales Process Builder', 35, ['Draft 7-stage personal process', 'Link to persona'], ['Sales process artifact'], []),
      ],
      worksheets: ['Objection scenario cards', 'Sales process template'],
      assessments: ['Role-play observation rubric'],
      prepChecklist: ['Print scenario cards', 'Brief mentors on constructive feedback'],
      debriefQuestions: ['Who improved listening most?', 'Ready for Venture Board deck work?'],
      commonPitfalls: ['Aggressive closing language', 'Skipping debrief after role-play'],
      coachingTips: ['Celebrate good questions over good closes'],
      mentorGuide: { theme: 'Practice', coachingObjective: 'Build confident ethical sales habits.', observationAreas: ['Active listening', 'Objection composure', 'Peer feedback quality'] },
      expectedOutputs: ['Role-play feedback', 'Personal sales process'],
    },
    {
      dayNumber: 3,
      title: 'Day 23 — Venture Board Deck Workshop',
      theme: 'Board Presentation',
      learningObjectives: [
        'Structure a 10-minute Venture Board narrative',
        'Integrate portfolio, business plan, and market evidence slides',
        'Rehearse with timed squad feedback',
      ],
      decks: [
        deck('Program Coach Deck 01 — Venture Board Standards', 'Hour 200 gate preview.', [
          { title: 'Day 23 — Tell Your Venture Story', purpose: '' },
          { title: 'Board Deck Architecture', purpose: 'Problem, solution, market, ops, ask.' },
          { title: 'Evidence Standards', purpose: 'No vanity metrics.' },
          { title: 'Timing & Q&A Prep', purpose: '10 min + 5 min Q&A.' },
          { title: 'Deck 01 Close', purpose: '' },
        ]),
        deck('Program Coach Deck 02 — Rehearsal Lab', '', [
          { title: 'Rehearsal Round 1 — Squads', purpose: 'Timed run-throughs.' },
          { title: 'Feedback Capture Form', purpose: '' },
          { title: 'Revision Sprint', purpose: '' },
          { title: 'Mentor Coaching Corners', purpose: '' },
          { title: 'Day 23 Deliverables', purpose: '' },
        ]),
      ],
      sessionFlow: flow([
        ['0:00–0:25', 'Deck 01 — Board standards', ''],
        ['0:25–1:15', 'Rehearsal round 1', ''],
        ['1:15–1:25', 'Break', ''],
        ['1:25–2:05', 'Revision sprint', ''],
        ['2:05–2:35', 'Rehearsal round 2', ''],
        ['2:35–3:00', 'Reflection + Day 24 preview', ''],
      ]),
      activities: [
        act('Venture Board Rehearsal Lab', 90, ['10-minute timed presentations', 'Squad + mentor feedback'], ['Board deck v1', 'Feedback form'], ['Strongest evidence slide?']),
        act('Deck Revision Sprint', 40, ['Incorporate feedback', 'Sync portfolio links'], ['Board deck v2'], []),
      ],
      worksheets: ['Venture Board feedback form'],
      assessments: ['Board rehearsal rubric'],
      prepChecklist: ['Confirm board date logistics', 'Load feedback templates'],
      debriefQuestions: ['Which squads have credible market evidence?', 'Q&A weak spots?'],
      commonPitfalls: ['Slide overload', 'Missing ops/licensing story'],
      coachingTips: ['Push for one clear ask at the end'],
      mentorGuide: { theme: 'Storytelling', coachingObjective: 'Help squads tell a board-ready narrative.', observationAreas: ['Evidence quality', 'Timing', 'Q&A composure'] },
      expectedOutputs: ['Venture Board deck v2', 'Rehearsal feedback'],
    },
    {
      dayNumber: 4,
      title: 'Day 24 — 3-Year Blueprint & Business Plan Integration',
      theme: 'Three-Year Blueprint',
      learningObjectives: [
        'Draft a 3-year advisor venture blueprint with milestones',
        'Integrate business plan chapters into a cohesive narrative',
        'Align squad and individual portfolio sections for board review',
      ],
      decks: [
        deck('Program Coach Deck 01 — Three-Year Blueprint Framework', '', [
          { title: 'Day 24 — Blueprint Your Practice', purpose: '' },
          { title: 'Year 1 / 2 / 3 Milestones', purpose: 'Learning, growth, scale.' },
          { title: 'Business Plan Integration Map', purpose: 'Chapters 1–5 storyline.' },
          { title: 'Squad vs Individual Artifacts', purpose: '' },
          { title: 'Deck 01 Close', purpose: '' },
        ]),
        deck('Program Coach Deck 02 — Blueprint Builder Lab', '', [
          { title: 'Blueprint Worksheet Walkthrough', purpose: '' },
          { title: 'Milestone Validation Checklist', purpose: '' },
          { title: 'Portfolio Cross-Links', purpose: '' },
          { title: 'Peer Blueprint Review', purpose: '' },
          { title: 'Day 24 Deliverables', purpose: '' },
        ]),
      ],
      sessionFlow: flow([
        ['0:00–0:30', 'Deck 01 — Blueprint framework', ''],
        ['0:30–1:20', 'Blueprint builder lab', ''],
        ['1:20–1:30', 'Break', ''],
        ['1:30–2:10', 'Business plan integration workshop', ''],
        ['2:10–2:40', 'Peer review + portfolio sync', ''],
        ['2:40–3:00', 'Reflection', ''],
      ]),
      activities: [
        act('Three-Year Blueprint Builder', 50, ['Complete Year 1–3 milestones', 'Link to licensing and ops readiness'], ['3-year blueprint artifact'], []),
        act('Business Plan Integration Workshop', 40, ['Merge chapter summaries', 'Identify gaps'], ['Integrated plan outline'], []),
      ],
      worksheets: ['3-year blueprint template', 'Business plan integration checklist'],
      assessments: ['Blueprint completeness rubric'],
      prepChecklist: ['Review portfolio section links', 'Prepare integration checklist'],
      debriefQuestions: ['Are Year 1 milestones realistic post-licensing?', 'Missing business plan sections?'],
      commonPitfalls: ['Unrealistic revenue projections', 'Ignoring ops week learnings'],
      coachingTips: ['Anchor milestones to Hour 110 and 200 gates'],
      mentorGuide: { theme: 'Planning', coachingObjective: 'Ground ambition in executable milestones.', observationAreas: ['Milestone realism', 'Plan integration', 'Portfolio completeness'] },
      expectedOutputs: ['3-year blueprint', 'Integrated business plan outline'],
    },
    {
      dayNumber: 5,
      title: 'Day 25 — Segment 1 Capstone & Hour 200 Venture Board Prep',
      theme: 'Venture Board Gate',
      learningObjectives: [
        'Deliver final Venture Board presentation rehearsal',
        'Complete Hour 200 gate artifact checklist',
        'Celebrate Segment 1 completion and preview Segment 2',
      ],
      decks: [
        deck('Program Coach Deck 01 — Hour 200 Venture Board Gate', 'Capstone ceremony.', [
          { title: 'Day 25 — Segment 1 Capstone', purpose: '' },
          { title: 'Gate Evidence Checklist', purpose: 'Portfolio, plan, board deck, licensing path.' },
          { title: 'Final Presentation Format', purpose: '' },
          { title: 'Panel Q&A Standards', purpose: '' },
          { title: 'Deck 01 Close', purpose: '' },
        ]),
        deck('Program Coach Deck 02 — Segment 1 Close & Segment 2 Preview', '', [
          { title: 'Venture Board Final Run', purpose: '' },
          { title: 'Gate Sign-Off Ceremony', purpose: '' },
          { title: 'Segment 2 Preview — Scale & Leadership', purpose: '' },
          { title: 'Squad Celebration', purpose: '' },
          { title: 'Program Close', purpose: '' },
        ]),
      ],
      sessionFlow: flow([
        ['0:00–0:15', 'Deck 01 — Gate briefing', ''],
        ['0:15–1:15', 'Final Venture Board presentations', ''],
        ['1:15–1:45', 'Gate audit + sign-off', ''],
        ['1:45–2:15', 'Break + portfolio final sync', ''],
        ['2:15–2:45', 'Deck 02 — Celebration + Segment 2 preview', ''],
        ['2:45–3:00', 'Closing reflection', ''],
      ]),
      activities: [
        act('Final Venture Board Presentations', 60, ['10-minute board presentations', 'Panel Q&A'], ['Final board deck'], []),
        act('Hour 200 Gate Audit', 30, ['Verify artifacts with program coach', 'Record gate clearance'], ['Gate clearance record'], []),
        act('Segment 1 Capstone Ceremony', 25, ['Recognize squads and individuals', 'Segment 2 commitment'], ['Capstone acknowledgment'], []),
      ],
      worksheets: ['Hour 200 gate checklist'],
      assessments: ['Venture Board rubric', 'Gate checklist'],
      prepChecklist: ['Coordinate panel members', 'Prepare gate certificates', 'Segment 2 materials ready'],
      debriefQuestions: ['Who is board-ready today vs needs polish?', 'Energy for Segment 2?'],
      commonPitfalls: ['Gate as checkbox without presentation quality', 'Skipping remediation notes'],
      coachingTips: ['Document polish items before Segment 2 launch'],
      mentorGuide: { theme: 'Capstone', coachingObjective: 'Launch participants into Segment 2 with pride and clarity.', observationAreas: ['Board presentation quality', 'Artifact completeness', 'Professional presence'] },
      expectedOutputs: ['Final board presentation', 'Hour 200 gate clearance', 'Segment 2 readiness plan'],
    },
  ],
};

/**
 * @param {number} weekNum
 * @param {number} dayNum
 * @param {number} deckNum
 * @param {number} slideIdx
 */
function slideId(weekNum, dayNum, deckNum, slideIdx) {
  return `slide-w${weekNum}-d${dayNum}-dk${deckNum}-${String(slideIdx + 1).padStart(2, '0')}`;
}

/**
 * @param {string} dayId
 * @param {number} weekNum
 * @param {number} dayNum
 * @param {number} deckNum
 * @param {{ title: string, purpose?: string, slides: Array<Record<string, unknown>> }} draftDeck
 */
function draftDeckToJson(dayId, weekNum, dayNum, deckNum, draftDeck) {
  const presId = `presentation-w${weekNum}-d${dayNum}-deck-0${deckNum}`;
  const slides = (draftDeck.slides ?? []).map((s, i) => ({
    id: slideId(weekNum, dayNum, deckNum, i),
    presentationId: presId,
    title: String(s.title ?? `Slide ${i + 1}`),
    body: String(s.purpose ?? ''),
    speakerNotes: String(s.facilitatorNotes ?? draftDeck.purpose ?? ''),
    discussionQuestions: Array.isArray(s.discussionQuestions) ? s.discussionQuestions : [],
    sortOrder: i + 1,
  }));
  return {
    presentation: {
      id: presId,
      dayId,
      title: draftDeck.title,
      slideIds: slides.map((s) => s.id),
    },
    slides,
  };
}

/**
 * @param {number} weekNum
 * @param {number} dayNum
 * @param {Record<string, unknown>} weekMeta
 * @param {Record<string, unknown>} draftDay
 */
function writeDayBundle(weekNum, dayNum, weekMeta, draftDay) {
  const daySlug = `day-${dayNum}`;
  const dir = join(CONTENT_ROOT, `week-${weekNum}`, daySlug);

  if (weekNum === 2 && dayNum === 1 && existsSync(join(dir, 'day.json'))) {
    console.log(`skip week-${weekNum}/${daySlug} — already published`);
    return;
  }

  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const dayId = `day-segment-1-week-${weekNum}-${daySlug}`;
  const deck01 = draftDeckToJson(dayId, weekNum, dayNum, 1, draftDay.decks?.[0] ?? { title: 'Deck 01', slides: [] });
  const deck02 = draftDeckToJson(dayId, weekNum, dayNum, 2, draftDay.decks?.[1] ?? { title: 'Deck 02', slides: [] });

  const activities = (draftDay.activities ?? []).map((a, i) => ({
    id: `activity-w${weekNum}-d${dayNum}-${String(i + 1).padStart(2, '0')}`,
    dayId,
    title: a.title,
    durationMinutes: a.durationMinutes ?? 30,
    materials: [],
    instructions: a.instructions ?? [],
    outputs: a.outputs ?? [],
    debriefQuestions: a.debriefQuestions ?? [],
  }));

  const worksheetTitles = draftDay.worksheets ?? [];
  const worksheets = worksheetTitles.map((title, i) => ({
    id: `worksheet-w${weekNum}-d${dayNum}-${String(i + 1).padStart(2, '0')}`,
    dayId,
    title: String(title),
    questionIds: [],
  }));

  const assessmentId = `assessment-w${weekNum}-d${dayNum}`;
  const surveyId = `survey-w${weekNum}-d${dayNum}`;
  const reflectionId = `reflection-w${weekNum}-d${dayNum}`;

  writeJson(join(dir, 'day.json'), {
    id: dayId,
    segmentId: 'segment-1',
    weekId: weekMeta.id ?? `week-segment-1-${weekNum}`,
    dayNumber: dayNum,
    title: draftDay.title,
    theme: draftDay.theme ?? weekMeta.theme,
    durationHours: draftDay.durationHours ?? 4,
    learningObjectives: draftDay.learningObjectives ?? [],
    expectedOutputs: draftDay.expectedOutputs ?? [],
    portfolioDeliverables: [weekMeta.portfolioSection].filter(Boolean),
    businessPlanIntegration: weekMeta.businessPlanChapter ?? '',
    presentations: [deck01.presentation.id, deck02.presentation.id],
    activities: activities.map((a) => a.id),
    worksheets: worksheets.map((w) => w.id),
    assessments: [assessmentId],
  });

  writeJson(join(dir, 'presentation.json'), deck01);
  writeJson(join(dir, 'presentation-deck-02.json'), deck02);

  writeJson(join(dir, 'activities.json'), { activities });

  writeJson(join(dir, 'worksheets.json'), {
    worksheets,
    questions: [],
  });

  writeJson(join(dir, 'assessment.json'), {
    assessment: {
      id: assessmentId,
      dayId,
      title: (draftDay.assessments?.[0] ?? `Day ${dayNum} participation`) + '',
      description: 'Faculty delivery checklist — squad progress tracked via Squad XP.',
      rubricId: `rubric-${assessmentId}`,
    },
    rubric: {
      id: `rubric-${assessmentId}`,
      assessmentId,
      title: 'Delivery checklist',
      criteria: draftDay.expectedOutputs?.length
        ? draftDay.expectedOutputs
        : ['Session delivered', 'Activities completed', 'Portfolio sync confirmed'],
    },
  });

  writeJson(join(dir, 'survey.json'), {
    survey: {
      id: surveyId,
      dayId,
      title: draftDay.surveys?.[0] ?? `Day ${dayNum} pulse survey`,
      description: `Week ${weekNum} Day ${dayNum} facilitator pulse check`,
      status: 'active',
    },
    questions: [
      {
        id: `sq-w${weekNum}-d${dayNum}-01`,
        surveyId,
        prompt: 'How ready is the cohort for today\'s session flow?',
        type: 'rating',
        required: true,
        sortOrder: 1,
      },
    ],
  });

  writeJson(join(dir, 'contributions.json'), {
    dayId,
    contributesToPortfolio: [weekMeta.portfolioSection].filter(Boolean),
    contributesToBusinessPlan: [weekMeta.businessPlanChapter].filter(Boolean),
    contributesToCompetencies: [`competency-week-${weekNum}`],
  });

  writeJson(join(dir, 'facilitator-guide.json'), {
    dayId,
    title: `Facilitator Guide — ${draftDay.title}`,
    durationHours: draftDay.durationHours ?? 4,
    prepChecklist: draftDay.prepChecklist ?? [],
    sessionFlow: draftDay.sessionFlow ?? [],
    debriefQuestions: draftDay.debriefQuestions ?? [],
    commonPitfalls: draftDay.commonPitfalls ?? [],
    coachingTips: draftDay.coachingTips ?? [],
  });

  writeJson(join(dir, 'sessions.json'), {
    sessions: [
      {
        id: `session-w${weekNum}-d${dayNum}-full`,
        dayId,
        sessionNumber: 1,
        title: draftDay.title,
        durationMinutes: (draftDay.durationHours ?? 4) * 60,
        presentationIds: [deck01.presentation.id, deck02.presentation.id],
        activityIds: activities.map((a) => a.id),
        worksheetIds: worksheets.map((w) => w.id),
        assessmentIds: [assessmentId],
        reflectionIds: [reflectionId],
        surveyIds: [surveyId],
      },
    ],
  });

  writeJson(join(dir, 'reflections.json'), {
    reflections: [
      {
        id: reflectionId,
        dayId,
        title: draftDay.reflections?.[0] ?? `Day ${dayNum} closing reflection`,
        prompts: ['What landed best with your squad today?', 'What needs remediation before tomorrow?'],
      },
    ],
  });

  const mg = draftDay.mentorGuide ?? {};
  writeJson(join(dir, 'mentor-guide.json'), {
    dayId,
    theme: mg.theme ?? draftDay.theme ?? weekMeta.theme,
    title: `Mentor Guide — ${draftDay.title}`,
    coachingObjective: mg.coachingObjective ?? 'Support squad delivery and honest progress.',
    timing: {
      preSession: 'Review facilitator guide and deck speaker notes',
      duringSession: 'Circulate during squad activities',
      postSession: 'Complete squad weekly review snapshot',
    },
    discussionQuestions: draftDay.debriefQuestions ?? [],
    observationAreas: mg.observationAreas ?? [],
    coachingTips: draftDay.coachingTips ?? [],
    warningSigns: [],
    reflectionPrompts: [],
    expectedOutcomes: draftDay.expectedOutputs ?? [],
    activityCoachingNotes: [],
    debriefWithFaculty: [],
  });

  console.log(
    `wrote week-${weekNum}/${daySlug} — ${deck01.slides.length}+${deck02.slides.length} slides, ${activities.length} activities`,
  );
}

/** @param {Record<string, unknown>} weekDraft */
function loadWeekMeta(weekDraft) {
  const weekPath = join(CONTENT_ROOT, `week-${weekDraft.weekNumber}`, 'week.json');
  if (existsSync(weekPath)) {
    return JSON.parse(readFileSync(weekPath, 'utf8'));
  }
  return {
    id: `week-segment-1-${weekDraft.weekNumber}`,
    weekNumber: weekDraft.weekNumber,
    theme: weekDraft.theme,
    businessPlanChapter: weekDraft.businessPlanChapter,
    portfolioSection: weekDraft.portfolioSection,
  };
}

const allWeeks = [...DRAFT_WEEKS, WEEK_5_DRAFT];

for (const weekDraft of allWeeks) {
  const weekMeta = loadWeekMeta(weekDraft);
  for (const draftDay of weekDraft.days ?? []) {
    writeDayBundle(weekDraft.weekNumber, draftDay.dayNumber, weekMeta, draftDay);
  }
}

console.log('generate-playbook-weeks-2-5: done');
