import { useState } from 'react'

export default function JourneyLens({
  data,
  onSubmitReflection,
  submitting,
  error,
  sections = ['header', 'timeline', 'reflection', 'completed'],
}) {
  const show = (name) => sections.includes(name)
  const [drafts, setDrafts] = useState({})
  const reflection = data.reflection
  const showForm = reflection && !reflection.completed && reflection.prompts.length > 0

  function updateDraft(id, value) {
    setDrafts((prev) => ({ ...prev, [id]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const answers = reflection.prompts.map((p) => ({
      promptId: p.id,
      response: drafts[p.id]?.trim() ?? '',
    }))
    onSubmitReflection(answers)
  }

  return (
    <div className="space-y-5">
      {show('header') && (
        <section>
          <h2 className="text-title font-semibold text-spike-ink">Your financial life story</h2>
          <p className="mt-2 text-body text-slate-600">
            Each turn adds a chapter. Over time you will see why advisors document every step.
          </p>
        </section>
      )}

      {show('timeline') && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-title font-semibold text-spike-ink">Timeline</h3>
          <p className="mt-1 text-caption text-slate-500">Situations, decisions, and outcomes—linked together.</p>
          <ol className="mt-5 space-y-5 border-l-2 border-slate-200 pl-5">
            {data.timeline.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[1.4rem] top-1.5 h-3 w-3 rounded-full bg-spike-brand ring-4 ring-white" />
                <p className="text-label uppercase text-slate-400">{entry.kind}</p>
                <p className="mt-0.5 font-semibold text-spike-ink">{entry.title}</p>
                <p className="mt-1 text-body leading-relaxed text-slate-600">{entry.summary}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {show('reflection') && showForm && onSubmitReflection && (
        <section className="rounded-2xl border-2 border-spike-brand/25 bg-white p-5 shadow-sm">
          <h3 className="text-title font-semibold text-spike-ink">Pause and reflect</h3>
          <p className="mt-2 text-body text-slate-600">
            Advisors confirm the client understood the why—not just signed the form. Answer thoughtfully
            to connect this turn to your FNA.
          </p>
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-body text-red-700" role="alert">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {reflection.prompts.map((prompt) => (
              <label key={prompt.id} className="block">
                <span className="text-body font-medium text-spike-ink">{prompt.question}</span>
                <textarea
                  className="focus-game mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-body"
                  rows={3}
                  value={drafts[prompt.id] ?? ''}
                  onChange={(e) => updateDraft(prompt.id, e.target.value)}
                />
              </label>
            ))}
            <button type="submit" disabled={submitting} className="btn-primary focus-game w-full sm:w-auto">
              {submitting ? 'Saving…' : 'Complete reflection'}
            </button>
          </form>
        </section>
      )}

      {show('completed') && reflection?.completed && (
        <section className="space-y-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
          <div>
            <h3 className="text-title font-semibold text-emerald-950">What you learned</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-body text-emerald-900">
              {reflection.learningHighlights.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-white/80 px-4 py-4 ring-1 ring-emerald-100">
            <h3 className="text-body font-semibold text-emerald-950">Advisor insight</h3>
            <p className="mt-2 text-body leading-relaxed text-emerald-900">{reflection.advisorInsight}</p>
          </div>
          {data.advisorReadiness && (
            <p className="rounded-xl bg-emerald-100/80 px-4 py-3 text-body font-medium text-emerald-900">
              {data.advisorReadiness}
            </p>
          )}
        </section>
      )}
    </div>
  )
}
