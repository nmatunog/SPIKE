import { useEffect, useMemo, useState } from 'react';
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
  { id: 'curriculum', label: 'Curriculum', icon: Layers },
  { id: 'orientation', label: 'Orientation', icon: PlayCircle },
  { id: 'syllabus', label: 'Master Blueprint', icon: BookOpen },
];

function PathPill({ active, children, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[40px] shrink-0 rounded-lg px-3 py-2 text-left text-xs font-bold transition sm:text-sm ${
        active
          ? 'bg-[#8B0000] text-white shadow-sm'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
  const [refreshKey, setRefreshKey] = useState(0);

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
      ? 'Faculty'
      : userRole === 'mentor'
        ? 'Mentor'
        : 'Participant';

  const dayContent = bundle ? (
    userRole === 'faculty' || userRole === 'admin' ? (
      <FacultyPlaybookView key={refreshKey} bundle={bundle} />
    ) : userRole === 'mentor' ? (
      <MentorPlaybookView key={refreshKey} bundle={bundle} interns={interns} />
    ) : (
      <ParticipantDayView
        key={refreshKey}
        bundle={bundle}
        participantId={participantId}
        onProgress={() => setRefreshKey((k) => k + 1)}
      />
    )
  ) : (
    <p className="text-sm text-gray-500">
      Select a day with published content. Weeks 2–5 are listed; day bundles publish incrementally.
    </p>
  );

  const pathBar = (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
      <p className="mb-3 flex flex-wrap items-center gap-1 text-xs font-bold text-gray-500">
        <span className="uppercase tracking-wider">Path</span>
        <ChevronRight size={12} className="text-gray-400" />
        <span className="text-gray-800">{selectedSegment?.segment.title ?? 'Segment'}</span>
        {selectedWeek ? (
          <>
            <ChevronRight size={12} className="text-gray-400" />
            <span className="text-gray-800">Week {selectedWeek.week.weekNumber}</span>
          </>
        ) : null}
        {selectedDay ? (
          <>
            <ChevronRight size={12} className="text-gray-400" />
            <span className="text-gray-800">Day {selectedDay.day.dayNumber}</span>
          </>
        ) : null}
      </p>

      <div className="space-y-3">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">Week</p>
          <div className="flex flex-wrap gap-2">
            {weeks.length === 0 ? (
              <span className="text-sm text-gray-500">No weeks published.</span>
            ) : (
              weeks.map(({ slug, week }) => (
                <PathPill key={slug} active={weekSlug === slug} onClick={() => selectWeek(slug)}>
                  W{week.weekNumber}: {week.title}
                </PathPill>
              ))
            )}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">Day</p>
          <div className="flex flex-wrap gap-2">
            {days.length === 0 ? (
              <span className="text-sm text-gray-500">No days published for this week yet.</span>
            ) : (
              days.map(({ slug, day }) => (
                <PathPill key={slug} active={daySlug === slug} onClick={() => selectDay(slug)}>
                  D{day.dayNumber}: {day.title}
                </PathPill>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <PageContainer className="max-w-6xl">
      <div className="mb-5">
        <PageTitle>Playbook</PageTitle>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          <span className="font-semibold text-gray-800">{roleLabel} view</span> — Segment → Week →
          Day → Session curriculum.
          {dataSource === 'hybrid' ? (
            <span className="mt-1 block text-xs font-semibold text-emerald-700">
              Linked to Supabase reference data (content from /content JSON).
            </span>
          ) : null}
        </p>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {segments.map(({ slug, segment }) => (
          <PathPill
            key={slug}
            active={segmentSlug === slug}
            onClick={() => selectSegment(slug)}
            className="!text-sm"
          >
            {segment.title}
          </PathPill>
        ))}
      </div>

      <div className="space-y-4 lg:hidden">
        {(weeks.length > 2 || days.length > 3) && mobilePanel !== 'content' ? (
          <>
            <button
              type="button"
              onClick={() => setMobilePanel('content')}
              className="inline-flex min-h-[44px] items-center gap-1 text-sm font-bold text-[#8B0000]"
            >
              <ArrowLeft size={16} /> Back to day
            </button>
            {mobilePanel === 'weeks' && pathBar}
          </>
        ) : (
          <>
            {pathBar}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              {dayContent}
            </div>
          </>
        )}
      </div>

      <div className="hidden space-y-4 lg:block">
        {pathBar}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm xl:p-8">
          {dayContent}
        </div>
      </div>
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

  return (
    <div>
      <div className="border-b border-gray-200 bg-white px-4 py-2 sm:px-6 sm:py-3">
        <div className="container mx-auto flex max-w-6xl gap-2 overflow-x-auto scrollbar-thin">
          {TABS.map((item) => {
            const TabIcon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${
                  tab === item.id
                    ? 'bg-[#8B0000] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
