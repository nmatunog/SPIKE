import { useEffect, useMemo, useState } from 'react';
import { formatUiRoleLabel } from '../lib/terminology.js';
import { ArrowLeft, BookOpen, ChevronRight, Layers, PlayCircle } from 'lucide-react';
import { PageContainer, PageTitle } from '../components/layout/PageContainer.jsx';
import { ParticipantDayView } from '../components/playbook/ParticipantDayView.jsx';
import { FacultyPlaybookView } from '../components/playbook/FacultyPlaybookView.jsx';
import { MentorPlaybookView } from '../components/playbook/MentorPlaybookView.jsx';
import {
  getCurriculumDataSource,
  getDayContentBundle,
  hydrateCurriculumFromSupabase,
  listDays,
  listSegments,
  listWeeks,
} from '../lib/curriculumService.js';

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
 * }} props
 */
function ContentCurriculum({ participantId, userRole = 'intern', interns = [] }) {
  const [dataSource, setDataSource] = useState(() => getCurriculumDataSource());
  const [, setRefreshKey] = useState(0);

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
  const [segmentSlug, setSegmentSlug] = useState(segments[0]?.slug ?? 'segment-1');
  const weeks = useMemo(() => listWeeks(segmentSlug), [segmentSlug]);
  const [weekSlug, setWeekSlug] = useState(weeks[0]?.slug ?? 'week-1');
  const days = useMemo(() => listDays(segmentSlug, weekSlug), [segmentSlug, weekSlug]);
  const [daySlug, setDaySlug] = useState(days[0]?.slug ?? 'day-1');
  const [mobilePanel, setMobilePanel] = useState('content');

  const selectedSegment = segments.find((s) => s.slug === segmentSlug);
  const selectedWeek = weeks.find((w) => w.slug === weekSlug);
  const selectedDay = days.find((d) => d.slug === daySlug);
  const showSegmentPicker = segments.length > 1;

  let bundle = null;
  try {
    bundle = getDayContentBundle(segmentSlug, weekSlug, daySlug);
  } catch {
    bundle = null;
  }

  const selectSegment = (slug) => {
    setSegmentSlug(slug);
    const nextWeeks = listWeeks(slug);
    const w = nextWeeks[0]?.slug ?? '';
    setWeekSlug(w);
    const nextDays = w ? listDays(slug, w) : [];
    setDaySlug(nextDays[0]?.slug ?? '');
    setMobilePanel('content');
  };

  const selectWeek = (slug) => {
    setWeekSlug(slug);
    const nextDays = listDays(segmentSlug, slug);
    setDaySlug(nextDays[0]?.slug ?? '');
    setMobilePanel('content');
  };

  const selectDay = (slug) => {
    setDaySlug(slug);
    setMobilePanel('content');
  };

  const roleLabel =
    userRole === 'faculty' || userRole === 'admin'
      ? formatUiRoleLabel('faculty')
      : userRole === 'mentor'
        ? 'Mentor'
        : 'Participant';

  const dayContent = bundle ? (
    userRole === 'faculty' || userRole === 'admin' ? (
      <FacultyPlaybookView bundle={bundle} />
    ) : userRole === 'mentor' ? (
      <MentorPlaybookView
        bundle={bundle}
        interns={interns}
        mentorId={userRole === 'mentor' || userRole === 'admin' ? participantId : undefined}
      />
    ) : (
      <ParticipantDayView
        bundle={bundle}
        participantId={participantId}
        onProgress={() => setRefreshKey((k) => k + 1)}
      />
    )
  ) : (
    <p className="text-sm text-slate-500">
      Pick a week and day with published content.
    </p>
  );

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
      <PageTitle presentation subtitle={`${roleLabel} view — pick a week and day to open sessions.`}>
        Playbook
      </PageTitle>

      {showSegmentPicker ? (
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
            {pathBarMobile}
            <div className="spike-card lg:p-6 2xl:p-8">{dayContent}</div>
          </>
        )}
      </div>

      <div className="mt-5 hidden space-y-4 lg:block">
        {pathBarDesktop}
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
        />
      )}
      {tab === 'orientation' && orientationView}
      {tab === 'syllabus' && syllabusView}
    </div>
  );
}
