import { CheckCircle, Clock, Package, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  isActivityCompleted,
  markActivityCompleted,
} from '../../lib/playbookProgress.js';

/**
 * @param {{ activity: {
 *   id: string,
 *   title: string,
 *   durationMinutes: number,
 *   materials: string[],
 *   instructions: string[],
 *   outputs: string[],
 *   debriefQuestions: string[],
 * },
 *   participantId?: string,
 *   onCompleted?: () => void,
 *   ventureStudioHref?: string,
 *   interactiveModule?: { href: string, name: string },
 * }} props
 */
export function ActivityViewer({
  activity,
  participantId,
  onCompleted,
  ventureStudioHref,
  interactiveModule,
}) {
  const moduleLink =
    interactiveModule
    ?? (ventureStudioHref ? { href: ventureStudioHref, name: 'Venture Studio' } : undefined);
  const completed = participantId && isActivityCompleted(participantId, activity.id);

  function handleComplete() {
    if (!participantId) return;
    markActivityCompleted(participantId, activity.id, activity.dayId, activity);
    onCompleted?.();
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h4 className="font-bold text-gray-900">{activity.title}</h4>
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
          <Clock size={12} /> {activity.durationMinutes} min
        </span>
      </div>

      {activity.materials?.length > 0 ? (
        <div className="mb-4">
          <h5 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-gray-500">
            <Package size={14} /> Materials
          </h5>
          <ul className="list-inside list-disc text-sm text-gray-700">
            {activity.materials.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mb-4">
        <h5 className="mb-2 text-xs font-bold uppercase text-gray-500">Instructions</h5>
        <ol className="list-inside list-decimal space-y-1 text-sm text-gray-700">
          {activity.instructions.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="mb-4">
        <h5 className="mb-2 text-xs font-bold uppercase text-gray-500">Outputs</h5>
        <ul className="space-y-1 text-sm text-gray-700">
          {activity.outputs.map((o) => (
            <li key={o} className="rounded-lg bg-gray-50 px-3 py-2">
              {o}
            </li>
          ))}
        </ul>
      </div>

      {activity.debriefQuestions?.length > 0 ? (
        <div className="mb-4">
          <h5 className="mb-2 text-xs font-bold uppercase text-gray-500">Debrief questions</h5>
          <ul className="space-y-1 text-sm text-gray-700">
            {activity.debriefQuestions.map((q) => (
              <li key={q}>• {q}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {participantId ? (
        moduleLink ? (
          completed ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
              <CheckCircle size={14} /> Completed in {moduleLink.name}
            </span>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Complete all five {moduleLink.name} steps — this activity marks done automatically.
              </p>
              <Link
                to={moduleLink.href}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-spike px-4 py-2 text-sm font-bold text-white hover:bg-spike-light"
              >
                Open {moduleLink.name} <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          )
        ) : completed ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
            <CheckCircle size={14} /> Activity marked complete
          </span>
        ) : (
          <button
            type="button"
            onClick={handleComplete}
            className="min-h-[44px] rounded-lg bg-[#8B0000] px-4 py-2 text-sm font-bold text-white hover:bg-[#6B0000]"
          >
            Mark activity complete
          </button>
        )
      ) : null}
    </article>
  );
}
