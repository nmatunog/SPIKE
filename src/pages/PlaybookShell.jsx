import { useState } from 'react';
import { ArrowLeft, BookOpen, Layers, PlayCircle, Target } from 'lucide-react';
import { PageContainer, PageTitle } from '../components/layout/PageContainer.jsx';
import { PLAYBOOK_CURRICULUM } from '../data/playbookScaffold.js';

const TABS = [
  { id: 'curriculum', label: 'Curriculum', icon: Layers },
  { id: 'orientation', label: 'Orientation', icon: PlayCircle },
  { id: 'syllabus', label: 'Master Blueprint', icon: BookOpen },
];

function CurriculumScaffold() {
  const [segmentIdx, setSegmentIdx] = useState(0);
  const [weekIdx, setWeekIdx] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  const [mobilePanel, setMobilePanel] = useState('weeks');

  const segment = PLAYBOOK_CURRICULUM[segmentIdx];
  const week = segment?.weeks[weekIdx];
  const day = week?.days[dayIdx];

  const selectSegment = (idx) => {
    setSegmentIdx(idx);
    setWeekIdx(0);
    setDayIdx(0);
    setMobilePanel('weeks');
  };

  const selectWeek = (idx) => {
    setWeekIdx(idx);
    setDayIdx(0);
    setMobilePanel('days');
  };

  const selectDay = (idx) => {
    setDayIdx(idx);
    setMobilePanel('detail');
  };

  const weeksPanel = (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Weeks</h3>
      <ul className="space-y-2">
        {segment?.weeks.map((w, idx) => (
          <li key={w.title}>
            <button
              type="button"
              onClick={() => selectWeek(idx)}
              className={`min-h-[44px] w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                weekIdx === idx ? 'bg-red-50 text-[#8B0000]' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="line-clamp-2">
                Week {w.week}: {w.title}
              </span>
            </button>
          </li>
        ))}
      </ul>
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
      <ul className="space-y-2">
        {week?.days.map((d, idx) => (
          <li key={d.day}>
            <button
              type="button"
              onClick={() => selectDay(idx)}
              className={`min-h-[44px] w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                dayIdx === idx ? 'bg-red-50 text-[#8B0000]' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Day {d.day}
            </button>
          </li>
        ))}
      </ul>
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
      {day ? (
        <div className="space-y-5">
          <div className="flex items-start gap-2">
            <Target className="mt-0.5 shrink-0 text-[#8B0000]" size={20} />
            <h3 className="text-base font-bold text-gray-900 sm:text-lg">
              {segment.segment} · Week {week.week} · Day {day.day}
            </h3>
          </div>
          {[
            ['Learning objectives', day.objectives],
            ['Presentations', day.presentations],
            ['Activities', day.activities],
            ['Worksheets', day.worksheets],
            ['Assessments', day.assessments],
            ['Portfolio deliverables', day.portfolioDeliverables],
          ].map(([title, items]) => (
            <div key={title}>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">{title}</h4>
              {items.length > 0 ? (
                <ul className="space-y-1 text-sm text-gray-700">
                  {items.map((item) => (
                    <li key={item} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-gray-400">None scheduled</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Select a week and day.</p>
      )}
    </div>
  );

  return (
    <PageContainer>
      <div className="mb-6">
        <PageTitle>Playbook</PageTitle>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          Future curriculum engine — mock segment / week / day structure for Sprint 01.
        </p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {PLAYBOOK_CURRICULUM.map((seg, idx) => (
          <button
            key={seg.segment}
            type="button"
            onClick={() => selectSegment(idx)}
            className={`shrink-0 rounded-lg px-3 py-2.5 text-xs font-bold transition sm:text-sm ${
              segmentIdx === idx
                ? 'bg-[#8B0000] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {seg.segment}
          </button>
        ))}
      </div>

      {/* Mobile: one panel at a time */}
      <div className="space-y-4 lg:hidden">
        {mobilePanel === 'weeks' && weeksPanel}
        {mobilePanel === 'days' && daysPanel}
        {mobilePanel === 'detail' && detailPanel}
      </div>

      {/* Desktop: three-column layout */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-4">{weeksPanel}{daysPanel}{detailPanel}</div>
    </PageContainer>
  );
}

/**
 * Playbook module — curriculum scaffold + legacy orientation / syllabus views.
 */
export function PlaybookShell({ orientationView, syllabusView }) {
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
                  tab === item.id ? 'bg-[#8B0000] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TabIcon size={16} /> {item.label}
              </button>
            );
          })}
        </div>
      </div>
      {tab === 'curriculum' && <CurriculumScaffold />}
      {tab === 'orientation' && orientationView}
      {tab === 'syllabus' && syllabusView}
    </div>
  );
}
