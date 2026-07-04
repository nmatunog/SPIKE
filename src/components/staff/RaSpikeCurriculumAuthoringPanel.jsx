import { useMemo, useState } from 'react';
import { listRaSpikeCurriculumStatus } from '../../lib/raSpikeContentLoader.js';
import { RA_SPIKE_FRAMEWORK_STEPS, RA_SPIKE_FRAMEWORK_STEP_LABELS } from '../../lib/raSpikeCurriculumOutline.js';

/**
 * Coach view: curriculum outline + authoring prompts for unpublished content.
 * Never invents participant-facing copy.
 */
export function RaSpikeCurriculumAuthoringPanel() {
  const status = useMemo(() => listRaSpikeCurriculumStatus(), []);
  const [openWeek, setOpenWeek] = useState(() => {
    const firstBlank = status.find((w) => !w.contentReady);
    return firstBlank?.week ?? 1;
  });

  const selected = status.find((w) => w.week === openWeek) ?? status[0];
  const readyCount = status.filter((w) => w.contentReady).length;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">Curriculum authoring</h2>
        <p className="text-sm text-slate-600">
          SPIKE weekly flow ({RA_SPIKE_FRAMEWORK_STEPS.map((id) => RA_SPIKE_FRAMEWORK_STEP_LABELS[id]).join(' → ')}).
          Participants only see weeks marked ready. Unpublished weeks stay blank — do not fill with SPIKE Internship materials.
        </p>
        <p className="text-xs font-medium text-slate-500">
          {readyCount} of {status.length} weeks published
        </p>
      </header>

      <div className="grid gap-2 sm:grid-cols-4">
        {status.map((w) => (
          <button
            key={w.week}
            type="button"
            onClick={() => setOpenWeek(w.week)}
            className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
              openWeek === w.week
                ? 'border-spike bg-spike-muted/40 ring-1 ring-spike/30'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
            }`}
          >
            <p className="font-semibold text-slate-900">Week {w.week}</p>
            <p className="truncate text-xs text-slate-600">{w.title}</p>
            <p
              className={`mt-1 text-2xs font-bold uppercase tracking-wide ${
                w.contentReady ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {w.contentReady ? 'Ready' : 'Blank'}
            </p>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {selected.segment} · Week {selected.week}
            </p>
            <h3 className="text-base font-bold text-slate-900">{selected.title}</h3>
            <p className="text-sm text-slate-600">{selected.theme}</p>
          </div>

          <dl className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-white px-2 py-2">
              <dt className="text-slate-500">Steps</dt>
              <dd className="font-bold text-slate-900">{selected.stepCount}</dd>
            </div>
            <div className="rounded-lg bg-white px-2 py-2">
              <dt className="text-slate-500">Portfolio</dt>
              <dd className="font-bold text-slate-900">{selected.artifactCount}</dd>
            </div>
            <div className="rounded-lg bg-white px-2 py-2">
              <dt className="text-slate-500">Coach deck</dt>
              <dd className="font-bold text-slate-900">{selected.hasCoachDeck ? 'Yes' : 'No'}</dd>
            </div>
          </dl>

          {selected.prompts.length === 0 ? (
            <p className="text-sm text-emerald-800">
              No open authoring prompts for this week.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">Authoring prompts</p>
              <ol className="space-y-2">
                {selected.prompts.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950"
                  >
                    <p className="font-semibold">{p.slot}</p>
                    <p className="mt-1 leading-relaxed">{p.prompt}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Source files: <span className="font-mono">content/ra-spike/week-{selected.week}.json</span>
            {' '}· set <span className="font-mono">contentReady: true</span> only when steps are authored.
          </p>
        </div>
      ) : null}
    </section>
  );
}
