import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronDown, Clock, Layers, Presentation } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { ROUTES } from '../../routes/paths.js';
import {
  FACILITATORS_CONTENT_REFERENCE_META,
  FACILITATORS_CONTENT_REFERENCE_WEEKS,
} from '../../lib/facilitatorsContentReference.js';

function StatusBadge({ status }) {
  const published = status === 'published';
  return (
    <span
      className={
        published
          ? 'rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800'
          : 'rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900'
      }
    >
      {published ? 'Published' : 'Draft outline'}
    </span>
  );
}

function Section({ id, title, children }) {
  if (!children) return null;
  return (
    <section id={id} className="mt-5 scroll-mt-24">
      <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h4>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function BulletList({ items, empty }) {
  if (!items?.length) return empty ? <p className="text-sm text-slate-500">{empty}</p> : null;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function DayPanel({ day, week }) {
  const [open, setOpen] = useState(false);
  const anchor = `week-${week.weekNumber}-day-${day.dayNumber}`;

  return (
    <article id={anchor} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 rounded-2xl px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5"
        aria-expanded={open}
      >
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-spike-muted text-sm font-bold text-spike">
          {day.programDay}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 sm:text-lg">{day.title}</h3>
            <StatusBadge status={day.status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Week {week.weekNumber} Day {day.dayNumber}
            {day.theme ? ` · ${day.theme}` : ''}
            {day.durationHours ? ` · ${day.durationHours}h` : ''}
          </p>
        </div>
        <ChevronDown
          size={20}
          className={`mt-1 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="border-t border-slate-100 px-4 pb-5 pt-4 sm:px-5">
          {day.playbookPath && day.status === 'published' ? (
            <p className="mb-4 text-sm">
              <Link to={day.playbookPath} className="font-semibold text-spike hover:underline">
                Open in Playbook →
              </Link>
            </p>
          ) : null}

          {day.learningObjectives?.length ? (
            <Section id={`${anchor}-objectives`} title="Learning objectives">
              <BulletList items={day.learningObjectives} />
            </Section>
          ) : null}

          {day.decks?.length ? (
            <Section id={`${anchor}-decks`} title="Presentation decks">
              <div className="space-y-4">
                {day.decks.map((deck, idx) => (
                  <div key={deck.id ?? `${anchor}-deck-${idx}`} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Presentation size={16} className="text-spike" aria-hidden />
                      <p className="font-semibold text-slate-900">
                        Deck {idx === 0 ? '01' : '02'} — {deck.title}
                      </p>
                      <StatusBadge status={deck.status ?? day.status} />
                      <span className="text-xs text-slate-500">({deck.slideCount} slides)</span>
                    </div>
                    {deck.purpose ? <p className="mt-2 text-sm text-slate-600">{deck.purpose}</p> : null}
                    {deck.pdfUrl || deck.pptxUrl ? (
                      <p className="mt-2 flex flex-wrap gap-3 text-sm">
                        {deck.pdfUrl ? (
                          <a
                            href={deck.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-spike hover:underline"
                          >
                            Open deck PDF
                          </a>
                        ) : null}
                        {deck.pptxUrl ? (
                          <a
                            href={deck.pptxUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-spike hover:underline"
                          >
                            Download PPTX
                          </a>
                        ) : null}
                      </p>
                    ) : null}
                    {deck.slides?.length ? (
                      <ol className="mt-3 space-y-2 text-sm">
                        {deck.slides.map((slide) => (
                          <li key={`${deck.id}-${slide.number}`} className="rounded-lg bg-white px-3 py-2">
                            <p className="font-medium text-slate-800">
                              Slide {slide.number}: {slide.title}
                            </p>
                            {slide.summary ? <p className="mt-1 text-slate-600">{slide.summary}</p> : null}
                            {slide.facilitatorNotes ? (
                              <p className="mt-1 text-xs text-slate-500">
                                <span className="font-semibold">Facilitator:</span> {slide.facilitatorNotes}
                              </p>
                            ) : null}
                            {slide.discussionQuestions?.length ? (
                              <ul className="mt-1 list-disc pl-4 text-xs text-indigo-800">
                                {slide.discussionQuestions.map((q) => (
                                  <li key={q}>{q}</li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {day.sessionFlow?.length ? (
            <Section id={`${anchor}-flow`} title="Session flow & timing">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-2 pr-3 font-semibold">Time</th>
                      <th className="py-2 pr-3 font-semibold">Activity</th>
                      <th className="py-2 font-semibold">Facilitator notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.sessionFlow.map((block) => (
                      <tr key={`${block.time}-${block.activity}`} className="border-b border-slate-100 align-top">
                        <td className="whitespace-nowrap py-2 pr-3 font-mono text-xs text-slate-600">{block.time}</td>
                        <td className="py-2 pr-3 font-medium text-slate-800">{block.activity}</td>
                        <td className="py-2 text-slate-600">{block.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          ) : null}

          {day.sessions?.length ? (
            <Section id={`${anchor}-sessions`} title="Sessions (Playbook bundle)">
              <div className="space-y-2">
                {day.sessions.map((s) => (
                  <div key={s.sessionNumber} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-800">
                      Session {s.sessionNumber}: {s.title}
                      <span className="ml-2 font-normal text-slate-500">({s.durationMinutes} min)</span>
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {day.activities?.length ? (
            <Section id={`${anchor}-activities`} title="Activities">
              <div className="space-y-3">
                {day.activities.map((act) => (
                  <div key={act.title} className="rounded-xl border border-slate-100 p-3 text-sm">
                    <p className="font-semibold text-slate-900">
                      {act.title}
                      <span className="ml-2 font-normal text-slate-500">({act.durationMinutes} min)</span>
                    </p>
                    {act.instructions?.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
                        {act.instructions.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                    {act.outputs?.length ? (
                      <p className="mt-2 text-xs text-emerald-800">
                        <span className="font-semibold">Outputs:</span> {act.outputs.join(' · ')}
                      </p>
                    ) : null}
                    {act.debriefQuestions?.length ? (
                      <p className="mt-1 text-xs text-indigo-800">
                        <span className="font-semibold">Debrief:</span> {act.debriefQuestions.join(' · ')}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Section id={`${anchor}-artifacts`} title="Worksheets & assessments">
              <BulletList items={[...(day.worksheets ?? []), ...(day.assessments ?? [])]} empty="See activity outputs." />
            </Section>
            <Section id={`${anchor}-close`} title="Reflections & surveys">
              <BulletList items={[...(day.reflections ?? []), ...(day.surveys ?? [])]} empty="End-of-day reflection in Playbook." />
            </Section>
          </div>

          {day.mentorGuide ? (
            <Section id={`${anchor}-mentor`} title="Mentor coaching focus">
              <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4 text-sm text-sky-950">
                <p className="font-semibold">{day.mentorGuide.title ?? `Mentor theme: ${day.mentorGuide.theme}`}</p>
                {day.mentorGuide.coachingObjective ? (
                  <p className="mt-2">{day.mentorGuide.coachingObjective}</p>
                ) : null}
                {day.mentorGuide.timing ? (
                  <ul className="mt-3 space-y-1 text-xs">
                    {Object.entries(day.mentorGuide.timing).map(([k, v]) => (
                      <li key={k}>
                        <span className="font-semibold capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span> {v}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {day.mentorGuide.discussionQuestions?.length ? (
                  <BulletList items={day.mentorGuide.discussionQuestions} />
                ) : null}
              </div>
            </Section>
          ) : null}

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <Section id={`${anchor}-prep`} title="Prep checklist">
              <BulletList items={day.prepChecklist} />
            </Section>
            <Section id={`${anchor}-outputs`} title="Expected outputs">
              <BulletList items={day.expectedOutputs} />
            </Section>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <Section id={`${anchor}-debrief`} title="Debrief questions">
              <BulletList items={day.debriefQuestions} />
            </Section>
            <Section id={`${anchor}-pitfalls`} title="Common pitfalls">
              <BulletList items={day.commonPitfalls} />
            </Section>
            <Section id={`${anchor}-tips`} title="Coaching tips">
              <BulletList items={day.coachingTips} />
            </Section>
          </div>
        </div>
      ) : null}
    </article>
  );
}

/** @param {{ backHref?: string, backLabel?: string }} [props] */
export function FacilitatorsContentReferencePage({
  backHref = ROUTES.programCoachHome,
  backLabel = 'Back to dashboard',
}) {
  const [activeWeek, setActiveWeek] = useState(1);
  const week = useMemo(
    () => FACILITATORS_CONTENT_REFERENCE_WEEKS.find((w) => w.weekNumber === activeWeek),
    [activeWeek],
  );

  return (
    <PageContainer wide>
      <Link
        to={backHref}
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-spike"
      >
        <ArrowLeft size={16} /> {backLabel}
      </Link>

      <header className="relative overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-950 via-slate-900 to-spike-dark px-6 py-8 text-white sm:px-10 sm:py-10">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200/90">
          Staff resource · Segment 1
        </p>
        <h1 className="mt-3 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
          <BookOpen size={32} className="text-indigo-200" />
          {FACILITATORS_CONTENT_REFERENCE_META.title}
        </h1>
        <p className="mt-2 text-sm text-slate-300">Version {FACILITATORS_CONTENT_REFERENCE_META.version}</p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
          {FACILITATORS_CONTENT_REFERENCE_META.purpose}
        </p>
        <p className="mt-3 text-xs text-slate-400">
          Audience: {FACILITATORS_CONTENT_REFERENCE_META.audience.join(' · ')}
        </p>
      </header>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
          <Clock size={16} /> Hour gates (Weeks 1–4)
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {FACILITATORS_CONTENT_REFERENCE_META.hourGates.map((gate) => (
            <div key={gate.hours} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <p className="font-bold text-slate-900">Hour {gate.hours}</p>
              <p className="text-slate-600">
                Week {gate.week} — {gate.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <nav
        aria-label="Weeks"
        className="sticky top-20 z-10 mt-6 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-card backdrop-blur"
      >
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          <Layers size={14} /> Select week
        </p>
        <div className="flex flex-wrap gap-2">
          {FACILITATORS_CONTENT_REFERENCE_WEEKS.map((w) => (
            <button
              key={w.weekNumber}
              type="button"
              onClick={() => setActiveWeek(w.weekNumber)}
              className={
                activeWeek === w.weekNumber
                  ? 'rounded-xl bg-spike px-4 py-2 text-sm font-semibold text-white'
                  : 'rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200'
              }
            >
              Week {w.weekNumber}: {w.title}
              {w.status === 'draft' ? ' (draft)' : ''}
            </button>
          ))}
        </div>
      </nav>

      {week ? (
        <section className="mt-6">
          <div className="mb-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-spike-muted/20 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                Week {week.weekNumber} — {week.title}
              </h2>
              <StatusBadge status={week.status} />
            </div>
            <p className="mt-1 text-sm font-medium text-spike">{week.theme}</p>
            <p className="mt-2 text-sm text-slate-600">{week.milestoneObjective}</p>
            <p className="mt-2 text-xs text-slate-500">
              {week.businessPlanChapter} · {week.portfolioSection} · Hour {week.hourGate} gate
            </p>
          </div>

          <div className="space-y-3">
            {week.days.map((day) => (
              <DayPanel key={day.dayId ?? `${week.weekNumber}-${day.dayNumber}`} day={day} week={week} />
            ))}
          </div>
        </section>
      ) : null}
    </PageContainer>
  );
}
