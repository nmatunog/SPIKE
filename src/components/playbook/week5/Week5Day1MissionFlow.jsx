import { useCallback, useState } from 'react';
import { WEEK5_DAY1_SECTIONS } from '../../../lib/week5Day1/missionConstants.js';
import { loadWeek5Day1MissionWithPrefill, computeRevenueProjections } from '../../../lib/week5Day1/service.js';
import { saveWeek5Day1Mission, computeWeek5Day1SectionProgress } from '../../../lib/week5Day1/storage.js';
import { revenueLogicSoftWarning } from '../../../lib/week5/playbookAiAssist.js';
import { usePlaybookMissionAutosave } from '../../../hooks/usePlaybookMissionAutosave.js';
import { PlaybookAutosaveStatus } from '../shared/PlaybookAutosaveStatus.jsx';
import { PlaybookCoachingList } from '../shared/PlaybookCoachingList.jsx';
import { PlaybookMissionField } from '../shared/PlaybookMissionField.jsx';
import { PlaybookJourneyBuilder } from '../shared/PlaybookJourneyBuilder.jsx';
import { Week5FecCanvasReviewPanel } from './Week5FecCanvasReviewPanel.jsx';

const SECTION_CARD = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';

/**
 * @param {{ participantId: string, readOnly?: boolean, onProgress?: () => void }} props
 */
export function Week5Day1MissionFlow({ participantId, readOnly = false, onProgress }) {
  const [state, setState] = useState(() => loadWeek5Day1MissionWithPrefill(participantId));
  const [activeId, setActiveId] = useState(WEEK5_DAY1_SECTIONS[0].id);

  const persist = useCallback(
    (mutate, versionMeta) => {
      if (readOnly) return;
      setState((prev) => {
        const draft = mutate(prev);
        const saved = saveWeek5Day1Mission(participantId, draft, versionMeta);
        onProgress?.();
        return saved;
      });
    },
    [participantId, readOnly, onProgress],
  );

  const { status, markDirty, flush } = usePlaybookMissionAutosave(
    state,
    (next) => {
      if (!readOnly) saveWeek5Day1Mission(participantId, next);
    },
    { enabled: !readOnly },
  );

  function setField(fieldId, value) {
    const prev = state.responses[fieldId] ?? '';
    persist(
      (s) => ({
        ...s,
        responses: { ...s.responses, [fieldId]: value },
      }),
      { fieldId, previousValue: prev, newValue: value },
    );
    markDirty();
  }

  function setReflection(key, value) {
    persist((s) => ({
      ...s,
      reflection: { ...s.reflection, [key]: value },
    }));
    markDirty();
  }

  const progress = computeWeek5Day1SectionProgress(state);
  const active = WEEK5_DAY1_SECTIONS.find((s) => s.id === activeId) ?? WEEK5_DAY1_SECTIONS[0];
  const revenueWarning = revenueLogicSoftWarning(state.responses);
  const projections = computeRevenueProjections(state.responses);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Finalize the Business</p>
          <p className="text-sm text-slate-700">
            {progress.touched} / {progress.total} sections touched · informational only
          </p>
        </div>
        <PlaybookAutosaveStatus status={status} />
      </div>

      <p className="text-sm leading-relaxed text-slate-600">
        You have already built the major parts of your venture. Today is about making the business clearer, stronger, and more believable — not adding more ideas.
      </p>

      <nav className="flex flex-wrap gap-2" aria-label="Day 1 sections">
        {WEEK5_DAY1_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveId(section.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              activeId === section.id
                ? 'bg-spike text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-spike/40'
            }`}
          >
            {section.number}. {section.title}
          </button>
        ))}
      </nav>

      <section className={SECTION_CARD} aria-labelledby={`w5d1-${active.id}`}>
        <p className="text-xs font-bold uppercase tracking-wider text-spike">Section {active.number}</p>
        <h3 id={`w5d1-${active.id}`} className="mt-1 text-xl font-bold text-slate-900">
          {active.title}
        </h3>
        <p className="mt-2 text-sm text-slate-600">{active.prompt}</p>
        <PlaybookCoachingList questions={active.coaching ?? []} className="mt-4" />

        {active.kind === 'journey' ? (
          <div className="mt-5">
            <PlaybookJourneyBuilder
              stages={state.journeyStages}
              readOnly={readOnly}
              onChange={(stages) => {
                persist((s) => ({ ...s, journeyStages: stages }));
                markDirty();
              }}
            />
          </div>
        ) : null}

        {active.kind === 'revenue' ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ['weeklyProspects', 'Weekly prospects', '10'],
              ['weeklyDiscovery', 'Weekly discovery sessions', '5'],
              ['weeklyPresentations', 'Weekly presentations', '3'],
              ['weeklyClients', 'Weekly clients', '1'],
              ['referralsPerClient', 'Referrals per client', '3'],
              ['revenuePerClient', 'Revenue per client', ''],
            ].map(([id, label, placeholder]) => (
              <PlaybookMissionField
                key={id}
                fieldId={id}
                label={label}
                type="text"
                placeholder={placeholder}
                value={state.responses[id] ?? ''}
                readOnly={readOnly}
                onChange={(v) => setField(id, v)}
              />
            ))}
            <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
              <p>Monthly projection: {projections.monthly.toLocaleString()}</p>
              <p>Annual projection: {projections.annual.toLocaleString()}</p>
              {revenueWarning ? (
                <p className="mt-2 text-xs text-amber-800" role="note">{revenueWarning}</p>
              ) : null}
            </div>
            <PlaybookMissionField fieldId="revenueNotes" label="Notes" value={state.responses.revenueNotes ?? ''} readOnly={readOnly} onChange={(v) => setField('revenueNotes', v)} />
          </div>
        ) : null}

        {active.kind === 'fec' ? (
          <div className="mt-5">
            <Week5FecCanvasReviewPanel
              participantId={participantId}
              pitchLocks={state.fecPitchLocks}
              readOnly={readOnly}
              onToggleLock={(fieldKey, locked) => {
                persist((s) => ({
                  ...s,
                  fecPitchLocks: { ...s.fecPitchLocks, [fieldKey]: locked },
                }));
                markDirty();
              }}
              onSaved={() => flush()}
            />
          </div>
        ) : null}

        {active.kind === 'reflection' ? (
          <div className="mt-5 space-y-4">
            {(active.reflectionPrompts ?? []).map((prompt, i) => (
              <PlaybookMissionField
                key={prompt}
                fieldId={`reflection-${i}`}
                label={prompt}
                value={state.reflection[`r${i}`] ?? ''}
                readOnly={readOnly}
                onChange={(v) => setReflection(`r${i}`, v)}
              />
            ))}
          </div>
        ) : null}

        {!active.kind && active.fields ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {active.fields.map((field) => (
              <PlaybookMissionField
                key={field.id}
                fieldId={field.id}
                label={field.label}
                type={field.type === 'text' ? 'text' : 'textarea'}
                value={state.responses[field.id] ?? ''}
                readOnly={readOnly}
                context={state.responses}
                onChange={(v) => setField(field.id, v)}
              />
            ))}
          </div>
        ) : null}

        {!readOnly ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => flush()}
              className="spike-btn-primary text-sm"
            >
              Save section
            </button>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              Status
              <select
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                value={state.sectionStatus[active.id] ?? 'in-progress'}
                onChange={(e) => {
                  persist((s) => ({
                    ...s,
                    sectionStatus: { ...s.sectionStatus, [active.id]: e.target.value },
                  }));
                  markDirty();
                }}
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="reviewed">Reviewed</option>
                <option value="ready-for-pitch">Ready for Pitch</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>
        ) : null}
      </section>
    </div>
  );
}
