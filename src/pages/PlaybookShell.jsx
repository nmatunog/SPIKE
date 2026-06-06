import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Layers, PlayCircle } from 'lucide-react';
import { PageContainer, PageTitle } from '../components/layout/PageContainer.jsx';
import { DayView } from '../components/playbook/DayView.jsx';
import {
  getDayContentBundle,
  listDays,
  listSegments,
  listWeeks,
} from '../lib/contentLoader.js';

const TABS = [
  { id: 'curriculum', label: 'Curriculum', icon: Layers },
  { id: 'orientation', label: 'Orientation', icon: PlayCircle },
  { id: 'syllabus', label: 'Master Blueprint', icon: BookOpen },
];

/**
 * @param {{ participantId?: string }} props
 */
function ContentCurriculum({ participantId }) {
  const segments = useMemo(() => listSegments(), []);
  const [segmentSlug, setSegmentSlug] = useState(segments[0]?.slug ?? 'segment-1');
  const weeks = useMemo(() => listWeeks(segmentSlug), [segmentSlug]);
  const [weekSlug, setWeekSlug] = useState(weeks[0]?.slug ?? 'week-1');
  const days = useMemo(() => listDays(segmentSlug, weekSlug), [segmentSlug, weekSlug]);
  const [daySlug, setDaySlug] = useState(days[0]?.slug ?? 'day-1');
  const [mobilePanel, setMobilePanel] = useState('weeks');
  const [refreshKey, setRefreshKey] = useState(0);

  const bundle = useMemo(() => {
    try {
      return getDayContentBundle(segmentSlug, weekSlug, daySlug);
    } catch {
      return null;
    }
  }, [segmentSlug, weekSlug, daySlug]);

  const selectSegment = (slug) => {
    setSegmentSlug(slug);
    const nextWeeks = listWeeks(slug);
    const w = nextWeeks[0]?.slug ?? '';
    setWeekSlug(w);
    const nextDays = w ? listDays(slug, w) : [];
    setDaySlug(nextDays[0]?.slug ?? '');
    setMobilePanel('weeks');
  };

  const selectWeek = (slug) => {
    setWeekSlug(slug);
    const nextDays = listDays(segmentSlug, slug);
    setDaySlug(nextDays[0]?.slug ?? '');
    setMobilePanel('days');
  };

  const selectDay = (slug) => {
    setDaySlug(slug);
    setMobilePanel('detail');
  };

  const weeksPanel = (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Weeks</h3>
      {weeks.length === 0 ? (
        <p className="text-sm text-gray-500">No weeks published for this segment.</p>
      ) : (
        <ul className="space-y-2">
          {weeks.map(({ slug, week }) => (
            <li key={slug}>
              <button
                type="button"
                onClick={() => selectWeek(slug)}
                className={`min-h-[44px] w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                  weekSlug === slug ? 'bg-red-50 text-[#8B0000]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="line-clamp-2">
                  Week {week.weekNumber}: {week.title}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const daysPanel = (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1">
      <button
        type="button"
        onClick={() => setMobilePanel('weeks')}
        className="mb-3 inline-flex min-h-[44px] items-center gap-1 text-sm font-bold text-[#8B0000] lg:hidden"
      >
        <ArrowLeft size={16} /> Weeks
      </button>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Days</h3>
      {days.length === 0 ? (
        <p className="text-sm text-gray-500">No days published for this week.</p>
      ) : (
        <ul className="space-y-2">
          {days.map(({ slug, day }) => (
            <li key={slug}>
              <button
                type="button"
                onClick={() => selectDay(slug)}
                className={`min-h-[44px] w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                  daySlug === slug ? 'bg-red-50 text-[#8B0000]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Day {day.dayNumber}: {day.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const detailPanel = (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-2">
      <button
        type="button"
        onClick={() => setMobilePanel('days')}
        className="mb-3 inline-flex min-h-[44px] items-center gap-1 text-sm font-bold text-[#8B0000] lg:hidden"
      >
        <ArrowLeft size={16} /> Days
      </button>
      {bundle ? (
        <DayView
          key={refreshKey}
          bundle={bundle}
          participantId={participantId}
          onWorksheetCompleted={() => setRefreshKey((k) => k + 1)}
        />
      ) : (
        <p className="text-sm text-gray-500">
          Select a day with published content, or complete the content bundle for this day.
        </p>
      )}
    </div>
  );

  return (
    <PageContainer>
      <div className="mb-6">
        <PageTitle>Playbook</PageTitle>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          Segment → Week → Day curriculum from the content engine. Complete worksheets to update
          your Venture Blueprint.
        </p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {segments.map(({ slug, segment }) => (
          <button
            key={slug}
            type="button"
            onClick={() => selectSegment(slug)}
            className={`shrink-0 rounded-lg px-3 py-2.5 text-xs font-bold transition sm:text-sm ${
              segmentSlug === slug
                ? 'bg-[#8B0000] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {segment.title}
          </button>
        ))}
      </div>

      <div className="space-y-4 lg:hidden">
        {mobilePanel === 'weeks' && weeksPanel}
        {mobilePanel === 'days' && daysPanel}
        {mobilePanel === 'detail' && detailPanel}
      </div>

      <div className="hidden gap-6 lg:grid lg:grid-cols-4">
        {weeksPanel}
        {daysPanel}
        {detailPanel}
      </div>
    </PageContainer>
  );
}

/**
 * Playbook module — content tree + legacy orientation / syllabus views.
 */
export function PlaybookShell({ orientationView, syllabusView, participantId }) {
  const [tab, setTab] = useState('curriculum');

  return (
    <div>
      <div className="border-b border-gray-200 bg-white px-4 py-2 sm:px-6 sm:py-3">
        <div className="container mx-auto flex gap-2 overflow-x-auto scrollbar-thin">
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
      {tab === 'curriculum' && <ContentCurriculum participantId={participantId} />}
      {tab === 'orientation' && orientationView}
      {tab === 'syllabus' && syllabusView}
    </div>
  );
}
