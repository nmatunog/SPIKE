import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Lightbulb, Scissors, Sparkles } from 'lucide-react';
import { WEEK3_DAY5_PITCH_BOXES, week3Day5PitchDraftKey } from '../../../lib/week3Day5FecPitchBoxes.js';
import {
  getWeek3Day5PitchBoxState,
  getWeek3Day5PitchOverview,
  isWeek3Day5PitchReady,
  saveWeek3Day5PitchBoxToFec,
  saveWeek3Day5PitchDraft,
  saveWeek3Day5PitchMultiColumnBoxToFec,
} from '../../../lib/week3Day5FecPitchService.js';
import { ViewMyFecCanvasLink } from '../../ventureDesign/ViewMyFecCanvasLink.jsx';

const BOX_COUNT = WEEK3_DAY5_PITCH_BOXES.length;

/**
 * Week 3 Day 5 — simplified FEC boxes 4–8 for venture pitch.
 * @param {{ participantId: string, readOnly?: boolean, onSaved?: () => void }} props
 */
export function Week3Day5FecPitchPanel({ participantId, readOnly = false, onSaved }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [drafts, setDrafts] = useState(() => ({}));
  const [savedBox, setSavedBox] = useState(/** @type {string | null} */ (null));

  const overview = useMemo(
    () => getWeek3Day5PitchOverview(participantId),
    [participantId, refreshKey],
  );

  const pitchReady = useMemo(() => isWeek3Day5PitchReady(participantId), [participantId, refreshKey]);

  useEffect(() => {
    /** @type {Record<string, string>} */
    const next = {};
    for (const box of overview) {
      if (box.columns?.length) {
        for (const col of box.columns) {
          const key = week3Day5PitchDraftKey(box.boxId, col.columnId ?? undefined);
          next[key] = col.draftText || col.editorSeed || '';
        }
      } else {
        next[box.boxId] = box.draftText || box.editorSeed || '';
      }
    }
    setDrafts(next);
  }, [overview]);

  function updateDraft(boxId, value, columnId) {
    const key = week3Day5PitchDraftKey(boxId, columnId);
    setDrafts((prev) => ({ ...prev, [key]: value }));
    if (!readOnly && participantId) {
      saveWeek3Day5PitchDraft(participantId, boxId, value, columnId);
    }
  }

  function applySuggestion(boxId, text, columnId) {
    updateDraft(boxId, text, columnId);
  }

  function saveBox(boxId, columnDefs) {
    if (readOnly) return;

    if (columnDefs?.length) {
      /** @type {Record<string, string>} */
      const columnTexts = {};
      for (const col of columnDefs) {
        columnTexts[col.id] = String(drafts[week3Day5PitchDraftKey(boxId, col.id)] ?? '').trim();
      }
      const allFilled = columnDefs.every((col) => columnTexts[col.id].length >= 12);
      if (!allFilled) return;
      saveWeek3Day5PitchMultiColumnBoxToFec(participantId, boxId, columnTexts);
    } else {
      const text = String(drafts[boxId] ?? '').trim();
      if (!text) return;
      saveWeek3Day5PitchBoxToFec(participantId, boxId, text);
    }

    setSavedBox(boxId);
    setRefreshKey((k) => k + 1);
    onSaved?.();
    window.setTimeout(() => setSavedBox(null), 2200);
  }

  function isBoxSaveDisabled(boxDef) {
    if (boxDef.columns?.length) {
      return !boxDef.columns.every((col) => {
        const text = String(drafts[week3Day5PitchDraftKey(boxDef.id, col.id)] ?? '').trim();
        return text.length >= 12;
      });
    }
    return String(drafts[boxDef.id] ?? '').trim().length < 12;
  }

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike">Pitch prep · FEC</p>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Boxes 4–8 for your venture pitch</h2>
        <p className="text-sm text-slate-600">
          Short, pitch-ready copy — pulled from Day 3 and Day 4 where available. Edit any box manually;
          Financial Engine has three FEC columns (Revenue, Economics, Sustainability).
        </p>
        {pitchReady ? (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <Check size={14} aria-hidden />
            All {BOX_COUNT} pitch boxes have content
          </p>
        ) : (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
            <AlertCircle size={14} aria-hidden />
            Complete all {BOX_COUNT} boxes before you pitch
          </p>
        )}
      </header>

      <div className="grid gap-4">
        {WEEK3_DAY5_PITCH_BOXES.map((boxDef) => {
          const state = getWeek3Day5PitchBoxState(participantId, boxDef.id);

          if (boxDef.columns?.length) {
            return (
              <article
                key={boxDef.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-spike">
                      Box {boxDef.number}
                    </p>
                    <h3 className="text-lg font-bold text-slate-900">{boxDef.label}</h3>
                    <p className="mt-1 text-sm text-slate-600">{boxDef.pitchHint}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {state.sourceLabel}
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  {state.columns.map((colState) => {
                    const col = colState.colDef;
                    if (!col) return null;
                    const draftKey = week3Day5PitchDraftKey(boxDef.id, col.id);
                    const draft = drafts[draftKey] ?? '';
                    const charCount = draft.length;
                    const maxChars = col.maxPitchChars ?? boxDef.maxPitchChars;
                    const overLimit = charCount > maxChars;

                    return (
                      <div key={col.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#001F3F]">{col.label}</p>

                        {!colState.draftText && !colState.savedFec && colState.suggestion ? (
                          <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/70 p-3">
                            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-900">
                              <Lightbulb size={14} aria-hidden />
                              Suggested from Financial Engine
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-sky-950">{colState.suggestion}</p>
                            {!readOnly ? (
                              <button
                                type="button"
                                onClick={() => applySuggestion(boxDef.id, colState.suggestion, col.id)}
                                className="mt-2 text-xs font-semibold text-spike hover:underline"
                              >
                                Use suggestion in editor
                              </button>
                            ) : null}
                          </div>
                        ) : null}

                        {colState.needsShorten && colState.savedFec && colState.shortenSuggestion ? (
                          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
                            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900">
                              <Scissors size={14} aria-hidden />
                              Saved FEC looks long for a pitch
                            </p>
                            {!readOnly ? (
                              <button
                                type="button"
                                onClick={() => applySuggestion(boxDef.id, colState.shortenSuggestion, col.id)}
                                className="mt-2 text-xs font-semibold text-spike hover:underline"
                              >
                                Use shorter suggestion
                              </button>
                            ) : null}
                          </div>
                        ) : null}

                        <label className="mt-3 block space-y-2">
                          <span className="text-sm font-semibold text-slate-800">Your pitch copy</span>
                          <textarea
                            value={draft}
                            onChange={(e) => updateDraft(boxDef.id, e.target.value, col.id)}
                            readOnly={readOnly}
                            rows={4}
                            placeholder={col.pitchHint}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
                          />
                          <p className={`text-xs ${overLimit ? 'font-semibold text-amber-700' : 'text-slate-500'}`}>
                            {charCount} / {maxChars} characters
                            {overLimit ? ' — consider shortening for your pitch' : ''}
                          </p>
                        </label>
                      </div>
                    );
                  })}
                </div>

                {!readOnly ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => saveBox(boxDef.id, boxDef.columns)}
                      disabled={isBoxSaveDisabled(boxDef)}
                      className="spike-btn-primary inline-flex min-h-[40px] items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savedBox === boxDef.id ? <Check size={16} aria-hidden /> : <Sparkles size={16} aria-hidden />}
                      {savedBox === boxDef.id ? 'Saved to FEC' : 'Save to FEC'}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          }

          const draft = drafts[boxDef.id] ?? '';
          const charCount = draft.length;
          const overLimit = charCount > boxDef.maxPitchChars;

          return (
            <article
              key={boxDef.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-spike">
                    Box {boxDef.number}
                  </p>
                  <h3 className="text-lg font-bold text-slate-900">{boxDef.label}</h3>
                  <p className="mt-1 text-sm text-slate-600">{boxDef.pitchHint}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {state.sourceLabel}
                </span>
              </div>

              {state.needsShorten && state.savedFec ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900">
                    <Scissors size={14} aria-hidden />
                    Saved FEC looks long for a pitch
                  </p>
                  <p className="mt-2 max-h-24 overflow-y-auto whitespace-pre-wrap text-xs text-amber-950/90">
                    {state.savedFec}
                  </p>
                  {state.shortenSuggestion ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-amber-900">Suggested shorter version:</p>
                      <p className="whitespace-pre-wrap text-sm text-amber-950">{state.shortenSuggestion}</p>
                      {!readOnly ? (
                        <button
                          type="button"
                          onClick={() => applySuggestion(boxDef.id, state.shortenSuggestion)}
                          className="text-xs font-semibold text-spike hover:underline"
                        >
                          Use suggestion in editor
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {!state.draftText && !state.savedFec && state.suggestion ? (
                <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/70 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-900">
                    <Lightbulb size={14} aria-hidden />
                    Suggested from Day 3–4
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-sky-950">{state.suggestion}</p>
                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={() => applySuggestion(boxDef.id, state.suggestion)}
                      className="mt-2 text-xs font-semibold text-spike hover:underline"
                    >
                      Use suggestion in editor
                    </button>
                  ) : null}
                </div>
              ) : null}

              <label className="mt-4 block space-y-2">
                <span className="text-sm font-semibold text-slate-800">Your pitch copy</span>
                <textarea
                  value={draft}
                  onChange={(e) => updateDraft(boxDef.id, e.target.value)}
                  readOnly={readOnly}
                  rows={5}
                  placeholder={boxDef.pitchHint}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
                />
                <p className={`text-xs ${overLimit ? 'font-semibold text-amber-700' : 'text-slate-500'}`}>
                  {charCount} / {boxDef.maxPitchChars} characters
                  {overLimit ? ' — consider shortening for your pitch' : ''}
                </p>
              </label>

              {!readOnly ? (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => saveBox(boxDef.id)}
                    disabled={isBoxSaveDisabled(boxDef)}
                    className="spike-btn-primary inline-flex min-h-[40px] items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savedBox === boxDef.id ? <Check size={16} aria-hidden /> : <Sparkles size={16} aria-hidden />}
                    {savedBox === boxDef.id ? 'Saved to FEC' : 'Save to FEC'}
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <ViewMyFecCanvasLink exit="/playbook?segment=1&week=3&day=5" compact label="Open full FEC canvas" />
    </div>
  );
}
