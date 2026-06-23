import { Link } from 'react-router-dom';
import { playbookHref, playbookWeek2StudioHref } from '../../../routes/paths.js';
import { WEEK2_COACH_TIMELINE } from '../../../lib/customerDiscovery/week2JourneyConstants.js';

/**
 * Coach view — Week 2 timeline (replaces lesson-plan-first layout).
 * @param {{ activeDay?: number, role?: 'faculty' | 'mentor' }} props
 */
export function Week2CoachTimeline({ activeDay = 1, role = 'faculty' }) {
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-spike">Week 2 timeline</p>
          <h2 className="text-xl font-bold text-slate-900">Activate — Customer Discovery to Validation</h2>
          <p className="mt-1 text-sm text-slate-600">
            Venture studio · Research lab · Professional development — one coherent week.
          </p>
        </div>
        <Link
          to={playbookWeek2StudioHref({ day: activeDay, mission: 'mission' })}
          className="spike-btn-secondary inline-flex min-h-[44px] items-center text-sm"
        >
          Preview SPIKE Studio
        </Link>
      </header>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {WEEK2_COACH_TIMELINE.map((card) => {
          const isActive = card.day === activeDay;
          return (
            <article
              key={card.day}
              className={`rounded-2xl border p-4 shadow-sm ${
                isActive ? 'border-spike/40 bg-spike/5 ring-1 ring-spike/20' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
                  {card.weekday}
                </span>
                <span className="text-xs font-semibold text-slate-500">Day {card.programDay}</span>
                <span className="rounded-full bg-venture-activate/15 px-2 py-0.5 text-[10px] font-bold text-venture-activate">
                  {card.status}
                </span>
              </div>
              <h3 className="mt-3 font-bold text-slate-900">{card.status}</h3>
              <Section title="Objectives" items={card.objectives} />
              <Section title="Slides" items={card.slides} />
              <Section title="Activities" items={card.activities} />
              <Section title="Deliverables" items={card.deliverables} />
              <Section title="Outcomes" items={card.outcomes} />
              <Link
                to={playbookHref({ segment: 1, week: 2, day: card.day })}
                className="mt-3 inline-flex text-sm font-semibold text-spike hover:underline"
              >
                Open Day {card.day} playbook →
              </Link>
            </article>
          );
        })}
      </div>
      {role === 'faculty' ? (
        <p className="text-xs text-slate-500">
          Interns follow the mission journey in SPIKE Studio — slides unlock via coach session notes.
        </p>
      ) : null}
    </section>
  );
}

/** @param {{ title: string, items: string[] }} props */
function Section({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex gap-1.5">
            <span className="text-spike">·</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
