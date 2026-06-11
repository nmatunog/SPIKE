import { UserCheck } from 'lucide-react';

/**
 * @param {{ guide: Record<string, unknown> }} props
 */
export function MentorGuidePanel({ guide }) {
  if (!guide?.title) return null;

  return (
    <div className="space-y-4 rounded-xl border border-sky-200 bg-sky-50/50 p-4 sm:p-5">
      <div>
        <h3 className="inline-flex items-center gap-2 text-lg font-bold text-sky-950">
          <UserCheck size={20} /> {String(guide.title)}
        </h3>
        <p className="mt-1 text-sm text-sky-800">
          Theme: {String(guide.theme)} · {String(guide.coachingObjective)}
        </p>
      </div>

      {Array.isArray(guide.discussionQuestions) ? (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-sky-700">
            Coaching questions
          </h4>
          <ul className="space-y-1 text-sm text-gray-800">
            {guide.discussionQuestions.map((q) => (
              <li key={String(q)}>• {String(q)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {Array.isArray(guide.observationAreas) ? (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-sky-700">
            Observation areas
          </h4>
          <div className="space-y-2">
            {guide.observationAreas.map((area) => (
              <div key={String(area.area ?? area)} className="rounded-lg bg-white p-3 text-sm">
                <p className="font-bold text-gray-900">{String(area.area ?? area)}</p>
                {Array.isArray(area.lookFor) ? (
                  <p className="mt-1 text-gray-600">
                    Look for: {area.lookFor.map(String).join(' · ')}
                  </p>
                ) : null}
                {Array.isArray(area.warningSigns) ? (
                  <p className="mt-1 text-amber-800">
                    Warning: {area.warningSigns.map(String).join(' · ')}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {Array.isArray(guide.coachingTips) ? (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-sky-700">
            Coaching tips
          </h4>
          <ul className="space-y-1 text-sm text-gray-700">
            {guide.coachingTips.map((tip) => (
              <li key={String(tip)}>• {String(tip)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {Array.isArray(guide.activityCoachingNotes) ? (
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-sky-700">
            Per-activity coaching notes
          </h4>
          <div className="space-y-2">
            {guide.activityCoachingNotes.map((item) => (
              <div key={String(item.activityId)} className="rounded-lg bg-white p-3 text-sm">
                <p className="font-semibold text-gray-800">{String(item.activityId)}</p>
                <p className="mt-1 text-gray-600">{String(item.note)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
