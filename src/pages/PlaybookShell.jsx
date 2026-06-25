import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatUiRoleLabel } from '../lib/terminology.js';
import { ArrowLeft, BookOpen, ChevronRight, Layers, PlayCircle } from 'lucide-react';
import { PageContainer, PageTitle } from '../components/layout/PageContainer.jsx';
import { InternWorkHydrationAlert } from '../components/intern/InternWorkHydrationAlert.jsx';
import { ParticipantDayView } from '../components/playbook/ParticipantDayView.jsx';
import { FacultyPlaybookView } from '../components/playbook/FacultyPlaybookView.jsx';
import { Week2ActivateHero } from '../components/playbook/week2/Week2ActivateHero.jsx';
import { Week2MissionPlaybookView } from '../components/playbook/week2/Week2MissionPlaybookView.jsx';
import {
  getCurriculumDataSource,
  getDayContentBundle,
  hydrateCurriculumFromSupabase,
  listDays,
  listSegments,
  listWeeks,
} from '../lib/curriculumService.js';
import { resolveInternPlaybookDay, resolveInternProgramWeek, UNLOCK_WEEK2 } from '../lib/programUnlocks.js';
import { getParticipantSquad } from '../lib/cohortFormationService.js';
import {
  getActiveWeek2Task,
  isWeek2MissionSlugForDay,
  parsePlaybookDayParam,
  resolveWeek2PlaybookDay,
} from '../lib/customerDiscovery/week2MissionService.js';
import { useInternWorkHydration } from '../hooks/useInternWorkHydration.js';
import { useCohortProgramDay } from '../hooks/useCohortProgramDay.js';
import { listPendingPlaybookReflections } from '../lib/pendingPlaybookReflectionService.js';
import { PlaybookDayClosingReflectionBlock } from '../components/playbook/PlaybookDayClosingReflectionBlock.jsx';
import { PlaybookReflectionNudge } from '../components/playbook/PlaybookReflectionNudge.jsx';

const TABS = [
  { id: 'curriculum', label: 'Curriculum', icon: Layers, roles: ['intern', 'faculty', 'mentor', 'admin'] },
  { id: 'orientation', label: 'Orientation', icon: PlayCircle, roles: ['faculty', 'mentor', 'admin'] },
  { id: 'syllabus', label: 'Master Blueprint', icon: BookOpen, roles: ['faculty', 'mentor', 'admin'] },
];

function PathPill({ active, children, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[40px] shrink-0 rounded-xl px-3 py-2 text-left text-xs font-semibold transition sm:text-sm ${
        active ? 'spike-nav-pill-active' : 'spike-nav-pill-inactive bg-slate-100'
      } ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * @param {{
 *   participantId?: string,
 *   userRole?: string,
 *   interns?: Array<{ id: string, name: string }>,
 *   internProgress?: object | null,
 * }} props
 */
function ContentCurriculum({ participantId, userRole = 'intern', interns = [], internProgress = null }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { version: hydrateVersion, ready: hydrateReady, error: hydrateError } = useInternWorkHydration(
    userRole === 'intern' ? participantId : null,
  );
  const [dataSource, setDataSource] = useState(() => getCurriculumDataSource());
  const [, setRefreshKey] = useState(0);

  const missionSlug = searchParams.get('mission') ?? '';
  const showCurriculum = searchParams.get('view') === 'curriculum';
  const focusReflection = searchParams.get('reflection') === '1';
  const { programDay, ready: calendarReady } = useCohortProgramDay();
  const missionNormalizeRef = useRef('');

  const entryDay = useMemo(() => {
    const fromQuery = parsePlaybookDayParam(searchParams.get('day'));
    if (fromQuery != null) {
      return fromQuery;
    }
    if (userRole === 'intern' && calendarReady) {
      return programDay.day;
    }
    if (userRole === 'intern') {
      return resolveInternPlaybookDay(internProgress);
    }
    return 1;
  }, [searchParams, userRole, internProgress, calendarReady, programDay.day]);

  const entryWeek = useMemo(() => {
    const fromQuery = Number.parseInt(searchParams.get('week') ?? '', 10);
    if (Number.isFinite(fromQuery) && fromQuery >= 1) return fromQuery;
    if (userRole === 'intern' && calendarReady) return programDay.week;
    if (userRole === 'intern') return resolveInternProgramWeek(internProgress);
    if (UNLOCK_WEEK2) return 2;
    return internProgress?.current_week ?? 1;
  }, [searchParams, userRole, internProgress, calendarReady, programDay.week]);

  const entrySegment = useMemo(() => {
    const fromQuery = Number.parseInt(searchParams.get('segment') ?? '', 10);
    if (Number.isFinite(fromQuery) && fromQuery >= 1) return fromQuery;
    return internProgress?.segment ?? 1;
  }, [searchParams, internProgress]);

  useEffect(() => {
    if (userRole !== 'intern' || !calendarReady) return;
    const hasWeek = searchParams.has('week');
    const hasDay = searchParams.has('day');
    if (hasWeek && hasDay) return;
    const params = new URLSearchParams(searchParams);
    params.set('segment', String(entrySegment));
    if (!hasWeek) params.set('week', String(programDay.week));
    if (!hasDay) params.set('day', String(programDay.day));
    setSearchParams(params, { replace: true });
  }, [userRole, calendarReady, searchParams, setSearchParams, entrySegment, programDay.week, programDay.day]);

  useEffect(() => {
    let active = true;
    hydrateCurriculumFromSupabase().then(() => {
      if (!active) return;
      setDataSource(getCurriculumDataSource());
    });
    return () => {
      active = false;
    };
  }, []);

  const segments = useMemo(() => listSegments(), []);
  const [segmentSlug, setSegmentSlug] = useState(`segment-${entrySegment}`);
  const weeks = useMemo(() => listWeeks(segmentSlug), [segmentSlug]);
  const [weekSlug, setWeekSlug] = useState(`week-${entryWeek}`);
  const days = useMemo(() => listDays(segmentSlug, weekSlug), [segmentSlug, weekSlug]);
  const [daySlug, setDaySlug] = useState(`day-${entryDay}`);
  const [mobilePanel, setMobilePanel] = useState('content');
  const [browseAllDays, setBrowseAllDays] = useState(userRole !== 'intern');

  useEffect(() => {
    setSegmentSlug(`segment-${entrySegment}`);
    setWeekSlug(`week-${entryWeek}`);
    const weekDays = listDays(`segment-${entrySegment}`, `week-${entryWeek}`);
    const preferred = weekDays.find((d) => d.slug === `day-${entryDay}`)?.slug
      ?? weekDays[0]?.slug
      ?? `day-${entryDay}`;
    setDaySlug(preferred);
    if (userRole === 'intern') setBrowseAllDays(false);
  }, [entrySegment, entryWeek, entryDay, userRole]);

  useEffect(() => {
    const weekDays = listDays(segmentSlug, weekSlug);
    if (weekDays.length && !weekDays.some((d) => d.slug === daySlug)) {
      setDaySlug(weekDays[0].slug);
    }
  }, [segmentSlug, weekSlug, daySlug]);

  useEffect(() => {
    setRefreshKey((k) => k + hydrateVersion);
  }, [hydrateVersion]);

  const selectedSegment = segments.find((s) => s.slug === segmentSlug);
  const selectedWeek = weeks.find((w) => w.slug === weekSlug);
  const selectedDay = days.find((d) => d.slug === daySlug);
  const showSegmentPicker = segments.length > 1;

  const isInternWeek2 =
    userRole === 'intern'
    && entryWeek >= 2
    && entrySegment === 1
    && (weekSlug === 'week-2' || selectedWeek?.week?.weekNumber === 2);

  const urlPlaybookDay = useMemo(
    () => parsePlaybookDayParam(searchParams.get('day')),
    [searchParams],
  );

  const playbookDayNumber =
    urlPlaybookDay != null
      ? urlPlaybookDay
      : (selectedDay?.day?.dayNumber ?? entryDay);

  const showMissionFirst =
    isInternWeek2
    && !showCurriculum
    && !browseAllDays
    && Boolean(participantId);

  const resolvedPlaybookDay = participantId
    ? resolveWeek2PlaybookDay(participantId, playbookDayNumber)
    : playbookDayNumber;

  useEffect(() => {
    if (!showMissionFirst) return;
    const raw = searchParams.get('day');
    const parsed = parsePlaybookDayParam(raw);
    if (parsed == null || raw === String(parsed)) return;
    const params = new URLSearchParams(searchParams);
    params.set('day', String(parsed));
    setSearchParams(params, { replace: true });
  }, [showMissionFirst, searchParams, setSearchParams]);

  useEffect(() => {
    if (!showMissionFirst || !participantId) return;

    const day = urlPlaybookDay ?? resolvedPlaybookDay;

    const apply = (mutate) => {
      const params = new URLSearchParams(window.location.search);
      const before = params.toString();
      mutate(params);
      if (params.toString() === before) return;
      setSearchParams(params, { replace: true });
    };

    if (!missionSlug) {
      const active = getActiveWeek2Task(participantId, day);
      const key = `empty:${day}:${active.slug}`;
      if (missionNormalizeRef.current === key) return;
      missionNormalizeRef.current = key;
      apply((params) => {
        params.set('mission', active.slug);
        params.set('day', String(day));
      });
      return;
    }

    if (isWeek2MissionSlugForDay(missionSlug, day)) {
      missionNormalizeRef.current = '';
      return;
    }

    for (let d = 1; d <= 5; d += 1) {
      if (isWeek2MissionSlugForDay(missionSlug, d)) {
        const key = `dayfix:${missionSlug}:${d}`;
        if (missionNormalizeRef.current === key) return;
        missionNormalizeRef.current = key;
        apply((params) => {
          params.set('day', String(d));
        });
        return;
      }
    }

    const active = getActiveWeek2Task(participantId, day);
    const key = `reset:${day}:${active.slug}`;
    if (missionNormalizeRef.current === key) return;
    missionNormalizeRef.current = key;
    apply((params) => {
      params.set('mission', active.slug);
    });
  }, [showMissionFirst, participantId, missionSlug, urlPlaybookDay, resolvedPlaybookDay, setSearchParams]);

  function openCurriculumView() {
    const params = new URLSearchParams(searchParams);
    params.set('view', 'curriculum');
    setSearchParams(params);
  }

  function backToMissionView() {
    const params = new URLSearchParams(searchParams);
    params.delete('view');
    if (participantId) {
      const day = resolveWeek2PlaybookDay(participantId, playbookDayNumber);
      params.set('mission', getActiveWeek2Task(participantId, day).slug);
      params.set('day', String(day));
    }
    setSearchParams(params);
  }

  let bundle = null;
  try {
    bundle = getDayContentBundle(segmentSlug, weekSlug, daySlug);
  } catch {
    bundle = null;
  }

  function syncPlaybookQuery(segment, week, day) {
    const params = new URLSearchParams(searchParams);
    params.set('segment', String(segment));
    params.set('week', String(week));
    params.set('day', String(day));
    setSearchParams(params, { replace: true });
  }

  const selectSegment = (slug) => {
    setSegmentSlug(slug);
    const nextWeeks = listWeeks(slug);
    const w = nextWeeks[0]?.slug ?? '';
    setWeekSlug(w);
    const nextDays = w ? listDays(slug, w) : [];
    const nextDay = nextDays[0]?.slug ?? '';
    setDaySlug(nextDay);
    setMobilePanel('content');
    const weekNum = Number.parseInt(w.replace('week-', ''), 10) || 1;
    const dayNum = Number.parseInt(String(nextDay).replace('day-', ''), 10) || 1;
    syncPlaybookQuery(Number.parseInt(slug.replace('segment-', ''), 10) || 1, weekNum, dayNum);
  };

  const selectWeek = (slug) => {
    setWeekSlug(slug);
    const nextDays = listDays(segmentSlug, slug);
    const nextDay = nextDays[0]?.slug ?? `day-1`;
    setDaySlug(nextDay);
    setMobilePanel('content');
    const weekNum = Number.parseInt(slug.replace('week-', ''), 10) || 1;
    const dayNum = Number.parseInt(String(nextDay).replace('day-', ''), 10) || 1;
    syncPlaybookQuery(entrySegment, weekNum, dayNum);
  };

  const selectDay = (slug) => {
    setDaySlug(slug);
    setMobilePanel('content');
    const weekNum = selectedWeek?.week.weekNumber ?? entryWeek;
    const dayNum = Number.parseInt(slug.replace('day-', ''), 10) || 1;
    const params = new URLSearchParams(searchParams);
    params.set('segment', String(entrySegment));
    params.set('week', String(weekNum));
    params.set('day', String(dayNum));
    if (showMissionFirst && participantId) {
      const resolvedDay = resolveWeek2PlaybookDay(participantId, dayNum);
      params.set('mission', getActiveWeek2Task(participantId, resolvedDay).slug);
    }
    setSearchParams(params, { replace: true });
  };

  const roleLabel =
    userRole === 'faculty' || userRole === 'admin'
      ? formatUiRoleLabel('faculty')
      : userRole === 'mentor'
        ? 'Mentor'
        : 'Participant';

  const isWeek2 = weekSlug === 'week-2' || selectedWeek?.week?.weekNumber === 2;
  const staffHeroVariant =
    userRole === 'faculty' || userRole === 'admin' ? 'faculty' : userRole === 'mentor' ? 'mentor' : 'intern';

  const squadRecord = participantId ? getParticipantSquad(participantId) : null;
  const internSquadName = squadRecord?.name ?? internProgress?.squad ?? '';

  const pendingTodayReflection =
    userRole === 'intern' && participantId && calendarReady
      ? listPendingPlaybookReflections(participantId, programDay).find(
          (row) => row.week === entryWeek && row.day === playbookDayNumber,
        )
      : null;

  let dayContent;

  if (showMissionFirst && participantId) {
    dayContent = (
      <Week2MissionPlaybookView
        participantId={participantId}
        squadName={internSquadName}
        missionSlug={missionSlug}
        playbookDay={resolvedPlaybookDay}
        calendarDay={playbookDayNumber}
        programWeek={entryWeek}
        focusReflection={focusReflection}
        pendingReflection={pendingTodayReflection}
        onOpenCurriculum={openCurriculumView}
        onProgress={() => setRefreshKey((k) => k + 1)}
        onMissionNavigate={(slug, missionDay) => {
          const next = new URLSearchParams(searchParams);
          next.set('mission', slug);
          next.set('day', String(missionDay ?? urlPlaybookDay ?? resolvedPlaybookDay));
          setSearchParams(next, { replace: true });
        }}
      />
    );
  } else if (bundle) {
    dayContent =
      userRole === 'faculty' || userRole === 'admin' ? (
        <FacultyPlaybookView bundle={bundle} />
      ) : userRole === 'mentor' ? (
        <ParticipantDayView
          bundle={bundle}
          staffPreview
          interns={interns}
          mentorId={participantId}
        />
      ) : (
        <>
          {isInternWeek2 && showCurriculum ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-spike/15 bg-spike/5 px-4 py-3">
              <p className="text-sm text-slate-700">
                Coach session notes — slides and activities for today&apos;s facilitation.
              </p>
              <button
                type="button"
                onClick={backToMissionView}
                className="text-sm font-semibold text-spike hover:underline"
              >
                ← Back to your mission
              </button>
            </div>
          ) : null}
          <ParticipantDayView
            bundle={bundle}
            participantId={participantId}
            onProgress={() => setRefreshKey((k) => k + 1)}
            skipWeek2Hero={isInternWeek2}
            focusReflection={focusReflection}
            pendingReflection={pendingTodayReflection}
            programWeek={entryWeek}
            programDay={playbookDayNumber}
          />
        </>
      );
  } else if (isWeek2) {
    dayContent = <Week2ActivateHero variant={staffHeroVariant} />;
  } else if (selectedWeek && (userRole === 'faculty' || userRole === 'admin' || userRole === 'mentor')) {
    dayContent = (
      <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-5 text-sm text-amber-950">
        <p className="font-semibold">
          Week {selectedWeek.week.weekNumber}: {selectedWeek.week.title}
        </p>
        {selectedWeek.week.milestoneObjective ? (
          <p className="mt-2 text-amber-900">{selectedWeek.week.milestoneObjective}</p>
        ) : null}
        <p className="mt-3 text-amber-800">
          Day content for this selection is not loaded yet — choose another day or refresh.
        </p>
      </div>
    );
  } else {
    dayContent = (
      <p className="text-sm text-slate-500">
        Pick a week and day with published content.
      </p>
    );
  }

  const internTodayHeader = userRole === 'intern' && selectedDay ? (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-3">
      <p className="text-sm text-indigo-950">
        <span className="font-semibold">
          Today — Week {selectedWeek?.week.weekNumber ?? entryWeek} · Day {selectedDay.day.dayNumber}
        </span>
        {selectedDay.day.title ? (
          <span className="text-indigo-800"> · {selectedDay.day.title}</span>
        ) : null}
      </p>
      {!browseAllDays ? (
        <button
          type="button"
          onClick={() => setBrowseAllDays(true)}
          className="text-sm font-semibold text-spike hover:underline"
        >
          Browse all days
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setBrowseAllDays(false)}
          className="text-sm font-semibold text-spike hover:underline"
        >
          Back to today
        </button>
      )}
    </div>
  ) : null;

  const showPathBar = (userRole !== 'intern' || browseAllDays) && !showMissionFirst;

  const pathBarMobile = (
    <div className="spike-card space-y-3">
      <p className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">
          {selectedSegment?.segment.title ?? 'Segment'}
        </span>
        {selectedWeek ? (
          <>
            <ChevronRight size={12} className="text-slate-400" />
            <span>Week {selectedWeek.week.weekNumber}</span>
          </>
        ) : null}
        {selectedDay ? (
          <>
            <ChevronRight size={12} className="text-slate-400" />
            <span>Day {selectedDay.day.dayNumber}</span>
          </>
        ) : null}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="spike-label mb-1 block">Week</span>
          <select
            value={weekSlug}
            onChange={(event) => selectWeek(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
          >
            {weeks.map(({ slug, week }) => (
              <option key={slug} value={slug}>
                Week {week.weekNumber}: {week.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="spike-label mb-1 block">Day</span>
          <select
            value={daySlug}
            onChange={(event) => selectDay(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
          >
            {days.map(({ slug, day }) => (
              <option key={slug} value={slug}>
                Day {day.dayNumber}: {day.title}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );

  const pathBarDesktop = (
    <div className="spike-card space-y-3">
      <p className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
        <span className="spike-label">Path</span>
        <ChevronRight size={12} className="text-slate-400" />
        <span className="font-medium text-slate-800">{selectedSegment?.segment.title ?? 'Segment'}</span>
        {selectedWeek ? (
          <>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="font-medium text-slate-800">Week {selectedWeek.week.weekNumber}</span>
          </>
        ) : null}
        {selectedDay ? (
          <>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="font-medium text-slate-800">Day {selectedDay.day.dayNumber}</span>
          </>
        ) : null}
      </p>

      <div className="flex flex-wrap gap-2">
        {weeks.map(({ slug, week }) => (
          <PathPill key={slug} active={weekSlug === slug} onClick={() => selectWeek(slug)}>
            Week {week.weekNumber}
          </PathPill>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {days.map(({ slug, day }) => (
          <PathPill key={slug} active={daySlug === slug} onClick={() => selectDay(slug)}>
            Day {day.dayNumber}
          </PathPill>
        ))}
      </div>
    </div>
  );

  return (
    <PageContainer presentation wide>
      <PageTitle presentation subtitle={
        showMissionFirst
          ? 'Week 2 Activate — your squad mission comes first. Coach notes unlock when you need them.'
          : userRole === 'mentor'
            ? 'Same curriculum interns see — decks, activities, and Venture Studio. Track submissions in People.'
            : `${roleLabel} view — pick a week and day to open sessions.`
      }>
        Playbook
      </PageTitle>

      {userRole === 'intern' ? (
        <InternWorkHydrationAlert ready={hydrateReady} error={hydrateError} />
      ) : null}

      {internTodayHeader}

      {userRole === 'intern' && !browseAllDays && !showMissionFirst ? (
        <p className="mt-3 text-sm text-slate-600">
          {entryWeek >= 2
            ? 'Week 2 Activate is live — open Customer Discovery from Venture Blueprint or continue in Playbook.'
            : 'All Week 1 days stay open — prior days do not need to be finished first. Work saves when you sign in.'}
        </p>
      ) : null}

      {showMissionFirst ? (
        <p className="mt-3 text-sm text-slate-600">
          Your squad mission is live — complete one step at a time. Evidence flows automatically into your Venture Portfolio.
        </p>
      ) : null}

      {showSegmentPicker && (userRole !== 'intern' || browseAllDays) ? (
        <div className="mb-4 mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {segments.map(({ slug, segment }) => (
            <PathPill
              key={slug}
              active={segmentSlug === slug}
              onClick={() => selectSegment(slug)}
            >
              {segment.title}
            </PathPill>
          ))}
        </div>
      ) : null}

      <div className="mt-5 space-y-4 lg:hidden">
        {(weeks.length > 2 || days.length > 3) && mobilePanel !== 'content' ? (
          <>
            <button
              type="button"
              onClick={() => setMobilePanel('content')}
              className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-spike"
            >
              <ArrowLeft size={16} /> Back to day
            </button>
            {mobilePanel === 'weeks' && pathBarMobile}
          </>
        ) : (
          <>
            {showPathBar ? pathBarMobile : null}
            <div className="spike-card lg:p-6 2xl:p-8">{dayContent}</div>
          </>
        )}
      </div>

      <div className="mt-5 hidden space-y-4 lg:block">
        {showPathBar ? pathBarDesktop : null}
        <div className="spike-card xl:p-8 2xl:p-10">{dayContent}</div>
      </div>

      {dataSource === 'hybrid' ? (
        <p className="mt-4 text-2xs font-medium text-emerald-700">
          Curriculum linked to Supabase reference data.
        </p>
      ) : null}
    </PageContainer>
  );
}

/**
 * Playbook module — role-specific curriculum + legacy orientation / syllabus views.
 */
export function PlaybookShell({
  orientationView,
  syllabusView,
  participantId,
  userRole = 'intern',
  interns = [],
  internProgress = null,
}) {
  const [tab, setTab] = useState('curriculum');
  const visibleTabs = useMemo(
    () => TABS.filter((item) => item.roles.includes(userRole)),
    [userRole],
  );

  useEffect(() => {
    if (!visibleTabs.some((item) => item.id === tab)) {
      setTab('curriculum');
    }
  }, [tab, visibleTabs]);

  return (
    <div>
      <div className="border-b border-slate-200/80 bg-white px-4 py-2 sm:px-6">
        <div className="mx-auto flex max-w-projection gap-2 overflow-x-auto py-1 scrollbar-thin">
          {visibleTabs.map((item) => {
            const TabIcon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  tab === item.id ? 'spike-nav-pill-active' : 'spike-nav-pill-inactive bg-slate-100'
                }`}
              >
                <TabIcon size={16} /> {item.label}
              </button>
            );
          })}
        </div>
      </div>
      {tab === 'curriculum' && (
        <ContentCurriculum
          participantId={participantId}
          userRole={userRole}
          interns={interns}
          internProgress={internProgress}
        />
      )}
      {tab === 'orientation' && orientationView}
      {tab === 'syllabus' && syllabusView}
    </div>
  );
}
