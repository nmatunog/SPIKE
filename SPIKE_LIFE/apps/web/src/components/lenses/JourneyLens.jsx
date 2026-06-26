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
    <div className="space-y-4">
      {show('header') && (
        <section>
          <h2 className="text-base font-semibold text-slate-900">What story am I creating?</h2>
          <p className="mt-1 text-xs text-slate-500">Your financial life timeline and reflections.</p>
        </section>
      )}

      {show('timeline') && (
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold">Timeline</h3>
        <ol className="mt-4 space-y-4 border-l-2 border-slate-200 pl-4">
          {data.timeline.map((entry) => (
            <li key={entry.id} className="relative">
              <span className="absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full bg-[#8B0000]" />
              <p className="text-xs uppercase tracking-wide text-slate-400">{entry.kind}</p>
              <p className="font-medium text-slate-900">{entry.title}</p>
              <p className="text-sm text-slate-600">{entry.summary}</p>
            </li>
          ))}
        </ol>
      </section>
      )}

      {show('reflection') && showForm && onSubmitReflection && (
        <section className="rounded-xl border-2 border-[#8B0000]/30 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Reflection</h3>
          <p className="mt-1 text-sm text-slate-600">
            Answer at least three prompts thoughtfully to complete the cycle.
          </p>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {reflection.prompts.map((prompt) => (
              <label key={prompt.id} className="block">
                <span className="text-sm font-medium text-slate-800">{prompt.question}</span>
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={2}
                  value={drafts[prompt.id] ?? ''}
                  onChange={(e) => updateDraft(prompt.id, e.target.value)}
                />
              </label>
            ))}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#8B0000] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Submit reflection'}
            </button>
          </form>
        </section>
      )}

      {show('completed') && reflection?.completed && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-semibold">Lessons learned</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
              {reflection.learningHighlights.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Advisor insight</h3>
            <p className="mt-1 text-sm text-slate-700">{reflection.advisorInsight}</p>
          </div>
          {data.advisorReadiness && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {data.advisorReadiness}
            </p>
          )}
        </section>
      )}
    </div>
  )
}
