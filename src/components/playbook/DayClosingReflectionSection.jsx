import { BookMarked, Sparkles } from 'lucide-react';
import { isReflectionCompleted } from '../../lib/playbookProgress.js';
import {
  dayClosingReflectionLabel,
  dayNumberFromBundle,
  getDayClosingReflections,
  weekDayFromReflectionMeta,
} from '../../lib/dayClosingReflection.js';
import { ReflectionViewer } from './ReflectionViewer.jsx';

/**
 * End-of-day closing reflection — one clear step before interns leave the Playbook day.
 * @param {{
 *   bundle: import('../../lib/contentLoader.js').DayContentBundle,
 *   participantId?: string,
 *   onCompleted?: () => void,
 * }} props
 */
export function DayClosingReflectionSection({ bundle, participantId, onCompleted }) {
  const closingReflections = getDayClosingReflections(bundle);
  if (!closingReflections.length) return null;

  const dayNumber = dayNumberFromBundle(bundle);
  const weekDay = closingReflections[0]
    ? weekDayFromReflectionMeta(closingReflections[0].id, closingReflections[0].dayId)
    : null;
  const dayLabel = weekDay
    ? `Week ${weekDay.week} · Day ${weekDay.day}`
    : dayNumber
      ? `Day ${dayNumber}`
      : 'Today';
  const allDone = participantId
    ? closingReflections.every((reflection) => isReflectionCompleted(participantId, reflection.id))
    : false;

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50 via-white to-spike-muted/30 shadow-card">
      <div className="border-b border-amber-200/80 bg-amber-100/60 px-5 py-4 sm:px-6">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-900">
          <Sparkles size={14} aria-hidden />
          Finish {dayLabel}
        </p>
        <h3 className="mt-1 text-xl font-bold text-slate-900">
          {weekDay
            ? `${dayClosingReflectionLabel(weekDay.day)} (Week ${weekDay.week})`
            : dayClosingReflectionLabel(dayNumber)}
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-700">
          Before you leave today, answer these prompts. Your reflection saves to your venture portfolio
          so your mentor and program coach can review how the day landed for you.
        </p>
        {allDone ? (
          <p className="mt-2 text-sm font-semibold text-emerald-800">
            ✓ {dayLabel} is complete — great work today.
          </p>
        ) : (
          <p className="mt-2 text-sm font-medium text-amber-900">
            This is the natural last step for {dayLabel} in the Playbook.
          </p>
        )}
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        {closingReflections.map((reflection) => (
          <div key={reflection.id} className="rounded-xl border border-amber-200/70 bg-white/90 p-1">
            <div className="mb-3 flex items-center gap-2 px-3 pt-3">
              <BookMarked size={18} className="text-amber-800" aria-hidden />
              <p className="text-sm font-semibold text-slate-900">{reflection.title}</p>
            </div>
            <div className="px-1 pb-1">
              <ReflectionViewer
                reflection={reflection}
                participantId={participantId}
                onCompleted={onCompleted}
                submitLabel="Save to my portfolio"
                savedMessage="Saved to your venture portfolio — mentors can review this on your coaching card."
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
