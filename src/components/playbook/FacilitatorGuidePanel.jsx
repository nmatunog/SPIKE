import { ClipboardList } from 'lucide-react';

/**
 * @param {{ guide: import('../../types/playbook').FacilitatorGuide }} props
 */
export function FacilitatorGuidePanel({ guide }) {
  return (
    <div className="space-y-5 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 sm:p-5">
      <div>
        <h3 className="inline-flex items-center gap-2 text-lg font-bold text-indigo-950">
          <ClipboardList size={20} /> {guide.title}
        </h3>
        <p className="mt-1 text-sm text-indigo-800">{guide.durationHours}h facilitator session</p>
      </div>

      <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
          Prep checklist
        </h4>
        <ul className="space-y-1 text-sm text-gray-800">
          {guide.prepChecklist.map((item) => (
            <li key={item} className="rounded-lg bg-white px-3 py-2">
              • {item}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
          Session flow
        </h4>
        <div className="space-y-2">
          {guide.sessionFlow.map((block) => (
            <div key={`${block.time}-${block.activity}`} className="rounded-lg bg-white p-3 text-sm">
              <p className="font-bold text-gray-900">
                {block.time} — {block.activity}
              </p>
              <p className="mt-1 text-gray-600">{block.notes}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
          Debrief questions
        </h4>
        <ul className="space-y-1 text-sm text-gray-800">
          {guide.debriefQuestions.map((q) => (
            <li key={q}>• {q}</li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
            Common pitfalls
          </h4>
          <ul className="space-y-1 text-sm text-gray-700">
            {guide.commonPitfalls.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
            Coaching tips
          </h4>
          <ul className="space-y-1 text-sm text-gray-700">
            {guide.coachingTips.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
