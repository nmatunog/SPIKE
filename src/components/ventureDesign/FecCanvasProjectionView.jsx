import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Layout, Monitor } from 'lucide-react';
import {
  FEC_AGENCY_BUILDER_EXTENSIONS,
  FEC_CANVAS_TITLE,
  FEC_TOP_BANNER,
  FEC_V2_PILLARS,
  FEC_VENTURE_SCORECARD,
} from '../../lib/fecCanvasConstants.js';
import {
  FEC_CANVAS_EXEMPLAR_ENGINES,
  FEC_CANVAS_EXEMPLAR_SUMMARY,
} from '../../lib/fecCanvasExemplar.js';
import { BLUEPRINT_LINKS } from '../../routes/paths.js';

/**
 * @param {{
 *   pillarKey: string,
 *   label: string,
 *   fields: Array<{ key: string, label: string }>,
 *   mode: 'blank' | 'full',
 *   engineKey: string,
 * }} props
 */
function PillarCard({ label, fields, mode, engineKey }) {
  const exemplar = FEC_CANVAS_EXEMPLAR_ENGINES[engineKey] ?? {};

  return (
    <div className="flex h-full flex-col rounded-2xl border-2 border-stone-200 bg-white p-4 shadow-sm md:p-5">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-spike">{label}</p>
      <div className="flex flex-1 flex-col gap-3">
        {fields.map((field) => (
          <div key={field.key}>
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{field.label}</p>
            {mode === 'full' ? (
              <p className="mt-1 text-sm leading-relaxed text-stone-800">
                {exemplar[field.key] ?? '—'}
              </p>
            ) : (
              <div className="mt-1 min-h-[3rem] rounded-lg border-2 border-dashed border-stone-200 bg-stone-50" />
            )}
          </div>
        ))}
      </div>
      {engineKey === 'prove_value' && mode === 'blank' ? (
        <p className="mt-3 text-xs text-stone-400">Venture scorecard unlocks as squads prove traction.</p>
      ) : null}
    </div>
  );
}

/**
 * Program Coach projection — full FEC overview with blank vs exemplar toggle.
 */
export function FecCanvasProjectionView() {
  const [mode, setMode] = useState(/** @type {'blank' | 'full'} */ ('blank'));

  return (
    <div className="-mx-4 min-h-screen bg-stone-950 font-sans text-white md:-mx-0">
      <header className="sticky top-0 z-50 border-b border-stone-800 bg-stone-950/95 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Monitor size={20} className="shrink-0 text-amber-400" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
                Program Coach projection
              </p>
              <h1 className="truncate text-sm font-bold md:text-base">{FEC_CANVAS_TITLE}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex rounded-xl border border-stone-700 bg-stone-900 p-1"
              role="group"
              aria-label="Canvas display mode"
            >
              <button
                type="button"
                onClick={() => setMode('blank')}
                className={`min-h-[40px] rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                  mode === 'blank' ? 'bg-white text-stone-900' : 'text-stone-400 hover:text-white'
                }`}
              >
                Blank canvas
              </button>
              <button
                type="button"
                onClick={() => setMode('full')}
                className={`min-h-[40px] rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                  mode === 'full' ? 'bg-amber-400 text-stone-900' : 'text-stone-400 hover:text-white'
                }`}
              >
                Full canvas
              </button>
            </div>
            <Link
              to={`${BLUEPRINT_LINKS.businessPlan}?start=1`}
              className="hidden min-h-[40px] items-center rounded-xl border border-stone-600 px-4 py-2 text-xs font-semibold text-stone-200 hover:bg-stone-800 sm:inline-flex"
            >
              Open workshop
            </Link>
            <Link
              to={BLUEPRINT_LINKS.businessPlan}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-stone-600 px-3 py-2 text-xs font-semibold text-stone-300 hover:bg-stone-800"
            >
              <ArrowLeft size={14} aria-hidden />
              Exit
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[100rem] px-4 py-6 md:px-8 md:py-10">
        <p className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-center text-sm font-medium text-amber-100 md:text-base">
          {FEC_TOP_BANNER}
        </p>

        <section className="mb-6 rounded-3xl border-4 border-spike bg-gradient-to-br from-spike to-spike-dark p-6 text-center shadow-2xl md:p-10">
          <p className="mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">
            <Layout size={16} aria-hidden />
            Center — Unified Venture Proposition
          </p>
          {mode === 'full' ? (
            <p className="mx-auto max-w-4xl text-lg font-semibold leading-relaxed text-white md:text-2xl">
              {FEC_CANVAS_EXEMPLAR_SUMMARY.unified_venture_proposition}
            </p>
          ) : (
            <div className="mx-auto max-w-3xl min-h-[5rem] rounded-xl border-2 border-dashed border-white/40 bg-white/5" />
          )}
        </section>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(FEC_V2_PILLARS).map(([engineKey, pillar]) => (
            <PillarCard
              key={engineKey}
              engineKey={engineKey}
              label={pillar.label}
              fields={
                engineKey === 'prove_value'
                  ? Object.values(FEC_VENTURE_SCORECARD.categories).flatMap((cat) =>
                      cat.fields.map((f) => ({ ...f, label: `${cat.label}: ${f.label}` })),
                    )
                  : pillar.fields
              }
              mode={mode}
            />
          ))}
        </div>

        {mode === 'full' ? (
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            {Object.entries(FEC_AGENCY_BUILDER_EXTENSIONS).map(([engineKey, section]) => (
              <PillarCard
                key={engineKey}
                engineKey={engineKey}
                label={section.label}
                fields={section.fields}
                mode="full"
              />
            ))}
          </div>
        ) : (
          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            {Object.entries(FEC_AGENCY_BUILDER_EXTENSIONS).map(([engineKey, section]) => (
              <div
                key={engineKey}
                className="rounded-2xl border-2 border-dashed border-stone-700 bg-stone-900/50 p-5 text-center"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-stone-500">
                  {section.label}
                </p>
                <p className="mt-2 text-sm text-stone-500">Agency builder track — Week 3+</p>
              </div>
            ))}
          </div>
        )}

        <section className="rounded-2xl border border-stone-700 bg-stone-900 p-5 md:p-8">
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-stone-300">
            3-year roadmap &amp; success picture
          </h2>
          {mode === 'full' ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['12 months', FEC_CANVAS_EXEMPLAR_SUMMARY.roadmap_12mo],
                ['24 months', FEC_CANVAS_EXEMPLAR_SUMMARY.roadmap_24mo],
                ['36 months', FEC_CANVAS_EXEMPLAR_SUMMARY.roadmap_36mo],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl bg-stone-800 p-4">
                  <p className="text-xs font-bold uppercase text-amber-400">{title}</p>
                  <p className="mt-2 text-sm text-stone-200">{body}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {['12 months', '24 months', '36 months'].map((title) => (
                <div
                  key={title}
                  className="min-h-[5rem] rounded-xl border-2 border-dashed border-stone-700 bg-stone-950"
                />
              ))}
            </div>
          )}
          {mode === 'full' ? (
            <p className="mt-4 text-sm italic text-stone-400">
              {FEC_CANVAS_EXEMPLAR_SUMMARY.success_narrative}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
