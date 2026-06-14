import { useMemo, useState } from 'react';
import { getMentorDayTemplates } from '../../lib/mentorEncodingTemplates.js';
import { WEEK1_DAY_META } from '../../lib/mentorWeek1Constants.js';
import { MentorDayDebriefCapture } from './MentorQuickCapture.jsx';

/**
 * Cohort debrief section on mentor home — pick a day, answer a few prompts.
 * @param {{ mentorId: string, showToast?: (message: string, type?: string) => void }} props
 */
export function MentorDayDebriefPanel({ mentorId, showToast }) {
  const [day, setDay] = useState(1);
  const { debrief } = useMemo(() => getMentorDayTemplates(day), [day]);

  if (!mentorId) return null;

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Day debrief</h3>
        <p className="mt-1 text-sm text-slate-600">
          After squad sessions, jot a few reflections for yourself. Helps you plan tomorrow&apos;s
          coaching.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {WEEK1_DAY_META.map((meta) => (
          <button
            key={meta.day}
            type="button"
            onClick={() => setDay(meta.day)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              day === meta.day
                ? 'bg-sky-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Day {meta.day}
          </button>
        ))}
      </div>

      <MentorDayDebriefCapture mentorId={mentorId} template={debrief} day={day} showToast={showToast} />
    </section>
  );
}
