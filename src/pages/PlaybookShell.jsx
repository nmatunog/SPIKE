import { useState } from 'react';
import { BookOpen, Layers, PlayCircle, Target } from 'lucide-react';
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

  const segment = PLAYBOOK_CURRICULUM[segmentIdx];
  const week = segment?.weeks[weekIdx];
  const day = week?.days[dayIdx];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Playbook</h2>
        <p className="mt-1 text-gray-600">
          Future curriculum engine — mock segment / week / day structure for Sprint 01.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {PLAYBOOK_CURRICULUM.map((seg, idx) => (
          <button
            key={seg.segment}
            type="button"
            onClick={() => {
              setSegmentIdx(idx);
              setWeekIdx(0);
              setDayIdx(0);
            }}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
              segmentIdx === idx
                ? 'bg-[#8B0000] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {seg.segment}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Weeks</h3>
          <ul className="space-y-2">
            {segment?.weeks.map((w, idx) => (
              <li key={w.title}>
                <button
                  type="button"
                  onClick={() => {
                    setWeekIdx(idx);
                    setDayIdx(0);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                    weekIdx === idx ? 'bg-red-50 text-[#8B0000]' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Week {w.week}: {w.title}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-1">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Days</h3>
          <ul className="space-y-2">
            {week?.days.map((d, idx) => (
              <li key={d.day}>
                <button
                  type="button"
                  onClick={() => setDayIdx(idx)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                    dayIdx === idx ? 'bg-red-50 text-[#8B0000]' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Day {d.day}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          {day ? (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Target className="text-[#8B0000]" size={20} />
                <h3 className="text-lg font-bold text-gray-900">
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
      </div>
    </div>
  );
}

/**
 * Playbook module — curriculum scaffold + legacy orientation / syllabus views.
 */
export function PlaybookShell({ orientationView, syllabusView }) {
  const [tab, setTab] = useState('curriculum');

  return (
    <div>
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="container mx-auto flex flex-wrap gap-2">
          {TABS.map((item) => {
            const TabIcon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${
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
