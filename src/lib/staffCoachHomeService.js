/**
 * Staff coach / mentor home dashboard — metrics, schedule, squad overview.
 */
import { groupInternsBySquad, deriveBlueprintCompletionPct } from './facultyMentorFrameworkService.js';
import {
  deriveAssignedParticipants,
  deriveCoachingQueue,
  week1OutputCompletionPct,
  getParticipantWeek1Outputs,
} from './mentorFrameworkService.js';
import { deriveVentureIdentity } from './myVentureHqService.js';
import { loadVentureDesignRecord, loadSquadDesignRecord } from './ventureDesignStudioService.js';
import { getParticipantSquad } from './cohortFormationService.js';
import {
  averageSquadRatingForParticipant,
  squadMemberIdsForIntern,
} from './staff/squadAssessmentService.js';
import { getSquadMentorReview, getSquadWeeklyXp } from './staff/squadXpService.js';
import { listSquadInternNotes } from './staff/squadInternNotesService.js';
import { listCoachingNotesForParticipant } from './coachingService.js';
import { WEEK1_DAY_META } from './mentorWeek1Constants.js';
import { getFacultyDayFromSeed, getMentorDayFromSeed } from './facultyMentorFrameworkSeed.js';
import { FACULTY_WEEK_THEMES, MENTOR_WEEK_THEMES } from './facultyMentorFrameworkService.js';
import {
  DEFAULT_DAY_SCHEDULE_SLOTS,
  FACULTY_DAY_SCHEDULE_OVERRIDES,
  MENTOR_DAY_SCHEDULE_OVERRIDES,
  facultyScheduleOverrideKey,
  formatScheduleTime,
  STAFF_COACH_TIPS,
} from './staffCoachHomeConstants.js';
import { playbookHref, staffStageGateHref } from '../routes/paths.js';

import { WEEK2_COACH_TIMELINE } from './customerDiscovery/week2JourneyConstants.js';
import { resolveEffectiveStaffProgramDay } from './programCalendar.js';

/** Segment 1 playbook seeds ship for week 1 — map calendar week onto published content. */
function staffContentWeekDay(role, week, day, segment = 1) {
  const template =
    role === 'mentor'
      ? getMentorDayFromSeed(segment, week, day)
      : getFacultyDayFromSeed(segment, week, day);
  if (template) return { week, day };
  if (segment === 1) return { week: 1, day };
  return { week, day };
}

/**
 * @param {'faculty' | 'mentor'} role
 * @param {number} week
 * @param {number} day
 */
export function deriveTodaySchedule(role, week = 1, day = 1, segment = 1) {
  const content = staffContentWeekDay(role, week, day, segment);
  const template =
    role === 'mentor'
      ? getMentorDayFromSeed(segment, content.week, content.day)
      : getFacultyDayFromSeed(segment, content.week, content.day);
  const theme = template?.theme ?? WEEK1_DAY_META.find((d) => d.day === day)?.theme ?? 'Program day';
  const overrideKey = facultyScheduleOverrideKey(segment, week, day);
  const overrideBlocks =
    role === 'mentor'
      ? MENTOR_DAY_SCHEDULE_OVERRIDES[overrideKey]
      : FACULTY_DAY_SCHEDULE_OVERRIDES[overrideKey];

  if (overrideBlocks?.length) {
    const items = overrideBlocks.map((block) => ({
      time: block.timeLabel ?? formatScheduleTime(block.startMinutes),
      title: block.title,
      description: block.description ?? '',
      minutes: block.defaultMinutes,
    }));
    return { theme, items };
  }

  const items = [];

  if (role === 'faculty') {
    const activities = /** @type {string[]} */ (template?.activities ?? []);
    activities.slice(0, DEFAULT_DAY_SCHEDULE_SLOTS.length).forEach((title, index) => {
      const slot = DEFAULT_DAY_SCHEDULE_SLOTS[index] ?? DEFAULT_DAY_SCHEDULE_SLOTS[0];
      items.push({
        time: formatScheduleTime(slot.startMinutes),
        title,
        description: template?.theme ? `${theme} — facilitator delivery` : '',
        minutes: slot.defaultMinutes,
      });
    });
  } else {
    const guide = /** @type {Record<string, unknown>} */ (template ?? {});
    items.push({
      time: '9:00 AM',
      title: `Day ${day} coaching focus`,
      description: String(guide.coaching_objective ?? guide.theme ?? theme),
      minutes: 45,
    });
    const areas = /** @type {string[]} */ (guide.observation_areas ?? []);
    areas.slice(0, 3).forEach((area, index) => {
      const slot = DEFAULT_DAY_SCHEDULE_SLOTS[index + 2] ?? DEFAULT_DAY_SCHEDULE_SLOTS[2];
      items.push({
        time: formatScheduleTime(slot.startMinutes),
        title: `Observe: ${area}`,
        description: String(guide.coaching_tips?.[0] ?? 'Check in with squads during studio time.'),
        minutes: 30,
      });
    });
  }

  if (!items.length) {
    items.push({
      time: '9:00 AM',
      title: `Week ${week} · Day ${day}`,
      description: theme,
      minutes: 240,
    });
  }

  return { theme, items };
}

/**
 * Hero summary for today's program delivery.
 * @param {'faculty' | 'mentor'} role
 * @param {number} week
 * @param {number} day
 */
export function deriveTodayHero(role, week = 1, day = 1) {
  if (week >= 2) {
    const card = WEEK2_COACH_TIMELINE.find((c) => c.day === day) ?? WEEK2_COACH_TIMELINE[0];
    const schedule = deriveTodaySchedule(role, week, day);
    const totalMinutes = schedule.items.reduce((sum, item) => sum + (item.minutes ?? 0), 0);
    return {
      dayLabel: `${card.weekday} · Day ${card.programDay}`,
      themeLabel: card.status,
      title: card.status,
      subtitle:
        role === 'mentor'
          ? 'Review your squad — interviews, portfolio, professional readiness, pitch.'
          : card.objectives[0] ?? 'Week 2 mission delivery',
      objectives: card.objectives,
      expectedOutputs: card.deliverables,
      estimatedMinutes: totalMinutes || 240,
      topActivities: card.activities.slice(0, 3).map((title) => ({ title, description: '' })),
    };
  }

  const content = staffContentWeekDay(role, week, day, 1);
  const template =
    role === 'mentor'
      ? getMentorDayFromSeed(1, content.week, content.day)
      : getFacultyDayFromSeed(1, content.week, content.day);
  const meta =
    WEEK1_DAY_META.find((d) => d.day === content.day) ?? WEEK1_DAY_META[0];
  const theme = template?.theme ?? meta.theme;
  const objectives =
    /** @type {string[]} */ (template?.learning_objectives ?? [])
    || (role === 'mentor' ? [String(template?.coaching_objective ?? '')] : []);
  const outputs =
    /** @type {string[]} */ (template?.expected_outputs ?? [meta.expectedOutput].filter(Boolean));
  const schedule = deriveTodaySchedule(role, week, day);
  const totalMinutes = schedule.items.reduce((sum, item) => sum + (item.minutes ?? 0), 0);

  return {
    dayLabel: `Week ${week} · Day ${day}`,
    themeLabel: meta.theme,
    title: meta.playbookTitle ?? theme,
    subtitle:
      role === 'faculty'
        ? String(objectives[0] ?? theme)
        : String(template?.coaching_objective ?? meta.objective ?? theme),
    objectives: objectives.filter(Boolean).slice(0, 4),
    expectedOutputs: outputs.filter(Boolean).slice(0, 5),
    estimatedMinutes: totalMinutes || 240,
    topActivities: schedule.items.slice(0, 3),
  };
}

/** @param {number} progressPct @param {number} [assessmentAvg] */
export function deriveEngagementLevel(progressPct, assessmentAvg = 0) {
  const score = progressPct * 0.7 + (assessmentAvg / 5) * 100 * 0.3;
  if (score >= 70) return { label: 'High', tone: 'high' };
  if (score >= 40) return { label: 'Medium', tone: 'medium' };
  return { label: 'Needs support', tone: 'low' };
}

/**
 * @param {Array<{ id: string, name: string, squad?: string }>} members
 * @param {number} week
 * @param {number} day
 */
function deriveSquadVentureLabel(members, week, day) {
  const squadName = members[0]?.squad ?? '';
  const squadRecord = members[0]?.id ? getParticipantSquad(members[0].id) : null;
  const squadDesign = loadSquadDesignRecord(squadRecord?.id ?? squadName);
  const consolidated = squadDesign?.consolidated?.step4;
  if (consolidated?.name?.trim()) {
    const tag = consolidated.tagline?.trim();
    return tag ? `${consolidated.name} — ${tag}` : consolidated.name;
  }

  for (const member of members) {
    const identity = deriveVentureIdentity(member.id, squadName);
    if (identity.hasNamedVenture) {
      return identity.tagline && !identity.tagline.startsWith('Name your')
        ? `${identity.ventureName} — ${identity.tagline.replace(/^"|"$/g, '')}`
        : identity.ventureName;
    }
  }

  const meta = WEEK1_DAY_META.find((d) => d.day === day);
  return meta?.playbookTitle ?? `Week ${week} venture forming`;
}

/**
 * @param {Array<{ id: string, name: string, squad?: string }>} members
 * @param {number} week
 * @param {number} day
 */
function deriveSquadNextAction(members, week, day) {
  const avgOutputs =
    members.length
      ? Math.round(
          members.reduce((sum, m) => sum + week1OutputCompletionPct(getParticipantWeek1Outputs(m.id)), 0)
            / members.length,
        )
      : 0;
  if (day >= 4 && avgOutputs < 60) {
    return { label: 'Venture Design Studio', sub: 'Today · FEC workshop' };
  }
  if (day === 5) {
    return { label: 'Portfolio presentation', sub: 'Week 1 review' };
  }
  const meta = WEEK1_DAY_META.find((d) => d.day === day) ?? WEEK1_DAY_META[0];
  return { label: meta.playbookTitle, sub: `Day ${day} · ${meta.theme}` };
}

/**
 * @param {Array<{ id: string, name: string, squad?: string, hours?: number, current_week?: number, current_day?: number }>} interns
 * @param {{ role: 'faculty' | 'mentor', staffName?: string, cohortStartDate?: string | null }} opts
 */
export function deriveStaffCoachHome(interns, opts) {
  const { role, staffName = 'Coach', cohortStartDate } = opts;
  const { week, day } = resolveEffectiveStaffProgramDay(cohortStartDate);
  const squads = groupInternsBySquad(interns);
  const queue = deriveCoachingQueue(interns, week);
  const assigned = deriveAssignedParticipants(interns);
  const schedule = deriveTodaySchedule(role, week, day);
  const todayHero = deriveTodayHero(role, week, day);
  const weekTheme =
    role === 'mentor'
      ? MENTOR_WEEK_THEMES[`1-${week}`] ?? 'Identity · Confidence · Direction'
      : FACULTY_WEEK_THEMES[`1-${week}`] ?? 'Dream · Discover · Decide';

  const activitiesToday = interns.filter((i) => {
    const notes = listCoachingNotesForParticipant(i.id);
    const today = new Date().toDateString();
    return notes.some((n) => new Date(n.createdAt ?? n.updatedAt ?? 0).toDateString() === today);
  }).length;

  const engagementScores = interns.map((intern) => {
    const squadName = intern.squad ?? 'Unassigned';
    const memberIds = squadMemberIdsForIntern(interns, squadName);
    const squadRating = averageSquadRatingForParticipant(intern.id, squadName, memberIds, week);
    const progress = deriveBlueprintCompletionPct(intern.id);
    return squadRating || progress / 20;
  });
  const avgEngagement = engagementScores.length
    ? (engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length).toFixed(1)
    : '—';

  const squadRows = squads.map((squad) => {
    const memberIds = squad.members.map((m) => m.id);
    const progressPct = memberIds.length
      ? Math.round(
          memberIds.reduce((sum, id) => sum + week1OutputCompletionPct(getParticipantWeek1Outputs(id)), 0)
            / memberIds.length,
        )
      : 0;
    const review = getSquadMentorReview(squad.name, week);
    const ratingValues = review
      ? Object.values(review.ratings ?? {}).filter((v) => v > 0)
      : [];
    const assessmentAvg = ratingValues.length
      ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
      : 0;
    const engagement = deriveEngagementLevel(progressPct, assessmentAvg);
    const next = deriveSquadNextAction(
      squad.members.map((m) => ({ ...m, squad: squad.name })),
      week,
      day,
    );
    const squadXpRow = getSquadWeeklyXp(squad.name, memberIds, week);

    return {
      slug: encodeURIComponent(squad.name),
      name: squad.name,
      ventureLabel: deriveSquadVentureLabel(
        squad.members.map((m) => ({ ...m, squad: squad.name })),
        week,
        day,
      ),
      memberCount: squad.count,
      progressPct,
      squadXp: squadXpRow.totalXp,
      engagement,
      nextAction: next.label,
      nextActionSub: next.sub,
    };
  });

  const tipIndex = new Date().getDate() % STAFF_COACH_TIPS.length;

  return {
    staffName: staffName.split(/\s+/)[0] || staffName,
    role,
    week,
    day,
    weekTheme,
    weekLabel: `Week ${week} · Day ${day} · ${todayHero.themeLabel}`,
    todayHero,
    metrics: {
      activeSquads: squads.length,
      participants: interns.length,
      activitiesToday,
      avgEngagement,
      needsCoaching: queue.at_risk.length + queue.needs_follow_up.length,
    },
    schedule,
    squadRows,
    upcomingDays: [1, 2, 3, 4, 5]
      .filter((d) => d > day)
      .slice(0, 3)
      .map((d) => {
        const meta = WEEK1_DAY_META.find((row) => row.day === d);
        return {
          day: d,
          label: `Day ${d}`,
          title: meta?.playbookTitle ?? `Day ${d}`,
          href: playbookHref({ week, day: d }),
        };
      }),
    playbookHref: playbookHref({ week, day }),
    frameworkPlaybookHref:
      role === 'mentor'
        ? `/mentor/playbook/1/${week}/${day}`
        : week >= 2
          ? playbookHref({ week, day })
          : `/program-coach/playbook/1/${week}/${day}`,
    stageGateHref: day === 5 ? staffStageGateHref(role, 1, week) : null,
    coachTip: STAFF_COACH_TIPS[tipIndex],
    coachingQueue: queue,
    participants: assigned,
  };
}

/** @param {string} squadName */
export function squadSlugFromName(squadName) {
  return encodeURIComponent(squadName);
}

/** @param {string} slug */
export function squadNameFromSlug(slug) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

/**
 * @param {Array<{ id: string, name: string, squad?: string, hours?: number }>} interns
 * @param {string} squadName
 */
export function deriveSquadHubDetail(interns, squadName, cohortStartDate) {
  const members = interns.filter((i) => (i.squad ?? 'Unassigned') === squadName);
  const { week, day } = resolveEffectiveStaffProgramDay(cohortStartDate);
  const ventureLabel = deriveSquadVentureLabel(members, week, day);

  const memberRows = members.map((intern) => {
    const outputs = getParticipantWeek1Outputs(intern.id);
    const progressPct = week1OutputCompletionPct(outputs);
    const design = loadVentureDesignRecord(intern.id);
    const identity = deriveVentureIdentity(intern.id, intern.squad ?? '');
    const squadName = intern.squad ?? 'Unassigned';
    const memberIds = squadMemberIdsForIntern(interns, squadName);
    const internNotes = listSquadInternNotes(intern.id, week);
    const notes = listCoachingNotesForParticipant(intern.id);
    const lastNote = notes[0];
    const lastMigratedNote = internNotes[0];

    return {
      id: intern.id,
      name: intern.name,
      ventureName: identity.ventureName,
      progressPct,
      fecStarted: design.isStarted || outputs.feCanvas,
      portfolioReady: outputs.portfolio,
      assessmentAvg: averageSquadRatingForParticipant(intern.id, squadName, memberIds, week),
      lastNotePreview:
        lastMigratedNote?.text?.trim()?.slice(0, 80)
        || lastNote?.summary?.trim()?.slice(0, 80)
        || '',
    };
  });

  const avgProgress = memberRows.length
    ? Math.round(memberRows.reduce((sum, m) => sum + m.progressPct, 0) / memberRows.length)
    : 0;

  return {
    squadName,
    ventureLabel,
    week,
    day,
    avgProgress,
    memberRows,
  };
}
