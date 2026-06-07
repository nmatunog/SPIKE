import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileImage, FileText, Presentation } from 'lucide-react';
import { CircularProgress } from '../CircularProgress.jsx';
import { AutoSaveField } from '../AutoSaveField.jsx';
import { buildExecutiveCanvasModel } from '../../../lib/executiveCanvasModel.js';
import {
  ensureDefaultYearGoals,
  getCanvasSummary,
  refreshAutoStrategyStatement,
  saveCanvasSummary,
  saveCanvasSummaryDebounced,
} from '../../../lib/canvasSummaryService.js';
import { computeCanvasCompletionPct } from '../../../lib/canvasService.js';
import {
  exportExecutiveCanvasPdf,
  exportExecutiveCanvasPng,
  exportExecutiveCanvasPpt,
  exportVentureBoardCoverSheet,
} from '../../../lib/canvasExportService.js';
import { VENTURE_READINESS_WEIGHTS } from '../../../lib/ventureReadinessScore.js';
import { ROUTES } from '../../../routes/paths.js';

function MetricStrip({ title, metrics }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/90 p-3">
      <p className="mb-2 text-2xs font-bold uppercase tracking-wide text-spike">{title}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg bg-slate-50 px-2 py-1.5 text-center">
            <p className="text-lg font-bold text-slate-900">{metric.value}</p>
            <p className="text-2xs text-slate-500">{metric.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EngineSection({ title, fields }) {
  return (
    <section className="executive-canvas-section rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <h4 className="mb-2 border-b border-spike/20 pb-1 text-xs font-bold uppercase tracking-wide text-spike">
        {title}
      </h4>
      <div className="space-y-2">
        {fields.map((field) => (
          <div key={field.key}>
            <p className="text-2xs font-semibold text-slate-500">{field.label}</p>
            <p className="text-xs leading-snug text-slate-800">{field.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * @param {{
 *   participantId: string,
 *   participantName: string,
 *   state: ReturnType<import('../../../lib/participantState.js').buildParticipantState>,
 * }} props
 */
export function ExecutiveCanvasSummary({ participantId, participantName, state }) {
  const exportRef = useRef(null);
  const [exporting, setExporting] = useState('');
  const [summary, setSummary] = useState(() => getCanvasSummary(participantId));

  useEffect(() => {
    ensureDefaultYearGoals(participantId, state.career_track);
    refreshAutoStrategyStatement(participantId, state.career_track);
    setSummary(getCanvasSummary(participantId));
  }, [participantId, state.career_track, state.blueprint_completion]);

  const model = useMemo(
    () => buildExecutiveCanvasModel({ participantId, participantName, state, summary }),
    [participantId, participantName, state, summary],
  );

  const canvasCompletion = computeCanvasCompletionPct(participantId);

  async function runExport(kind) {
    if (!exportRef.current) return;
    setExporting(kind);
    try {
      if (kind === 'png') {
        await exportExecutiveCanvasPng(exportRef.current);
      } else if (kind === 'pdf') {
        await exportExecutiveCanvasPdf(exportRef.current);
      } else if (kind === 'ppt') {
        await exportExecutiveCanvasPpt(model);
      } else if (kind === 'cover') {
        await exportVentureBoardCoverSheet(model);
      }
    } finally {
      setExporting('');
    }
  }

  function handleStrategySave(value) {
    saveCanvasSummaryDebounced(participantId, {
      strategy_statement: value,
      strategy_is_auto: false,
    });
    setSummary((prev) => ({ ...prev, strategy_statement: value, strategy_is_auto: false }));
  }

  function handlePrioritySave(index, value) {
    const key = `priority_${index + 1}`;
    saveCanvasSummaryDebounced(participantId, { [key]: value });
    setSummary((prev) => ({ ...prev, [key]: value }));
  }

  function handleYearGoalSave(index, value) {
    const keys = ['year1_goal', 'year2_goal', 'year3_goal'];
    saveCanvasSummaryDebounced(participantId, { [keys[index]]: value });
    setSummary((prev) => ({ ...prev, [keys[index]]: value }));
  }

  function handleRegenerateStrategy() {
    const generated = refreshAutoStrategyStatement(participantId, state.career_track);
    saveCanvasSummary(participantId, {
      strategy_statement: generated.strategy_statement,
      strategy_is_auto: true,
    });
    setSummary(getCanvasSummary(participantId));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="spike-label text-spike">Executive Canvas</p>
          <h3 className="text-lg font-semibold text-slate-900 lg:text-xl">
            My Business On One Page
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Landscape summary for portfolio, board reviews, mentoring, and export.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`${ROUTES.ventureBlueprint}/canvas`}
            className="spike-btn-secondary text-sm"
          >
            Edit Canvas
          </Link>
          <button
            type="button"
            className="spike-btn-secondary text-sm"
            disabled={Boolean(exporting)}
            onClick={() => runExport('png')}
          >
            <FileImage size={16} />
            {exporting === 'png' ? 'Exporting…' : 'PNG'}
          </button>
          <button
            type="button"
            className="spike-btn-secondary text-sm"
            disabled={Boolean(exporting)}
            onClick={() => runExport('pdf')}
          >
            <FileText size={16} />
            {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
          </button>
          <button
            type="button"
            className="spike-btn-secondary text-sm"
            disabled={Boolean(exporting)}
            onClick={() => runExport('ppt')}
          >
            <Presentation size={16} />
            {exporting === 'ppt' ? 'Exporting…' : 'PPT'}
          </button>
          <button
            type="button"
            className="spike-btn-primary text-sm"
            disabled={Boolean(exporting)}
            onClick={() => runExport('cover')}
          >
            <Download size={16} />
            {exporting === 'cover' ? 'Exporting…' : 'Board Cover'}
          </button>
        </div>
      </div>

      <div
        ref={exportRef}
        id="executive-canvas-export"
        className="executive-canvas-board mx-auto aspect-video w-full max-w-projection overflow-hidden rounded-2xl border border-slate-300 bg-gradient-to-br from-slate-50 via-white to-spike-muted/30 p-4 shadow-projection sm:p-5 lg:p-6"
      >
        <header className="mb-3 flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-spike px-2.5 py-1 text-xs font-bold tracking-wide text-white">
                SPIKE ASC
              </span>
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
                Financial Entrepreneurship Canvas
              </span>
            </div>
            <h2 className="mt-2 truncate text-xl font-bold text-slate-900 lg:text-2xl">
              {model.header.participantName}
            </h2>
            <p className="text-xs text-slate-600 lg:text-sm">
              {model.header.careerTrackLabel} · Updated {model.header.dateUpdated}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-start gap-4">
            <CircularProgress value={canvasCompletion} size={72} stroke={6} />
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div>
                <p className="text-2xs text-slate-500">Blueprint</p>
                <p className="font-bold text-slate-900">{model.header.blueprintCompletion}%</p>
              </div>
              <div>
                <p className="text-2xs text-slate-500">Segment</p>
                <p className="font-bold text-slate-900">{model.header.segment}</p>
              </div>
              <div>
                <p className="text-2xs text-slate-500">Position</p>
                <p className="font-bold text-slate-900">{model.header.careerPosition}</p>
              </div>
              <div>
                <p className="text-2xs text-slate-500">Readiness</p>
                <p className="font-bold text-spike">{model.readiness.composite}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-2 lg:grid-cols-4 lg:grid-rows-2 lg:gap-3">
          {model.engines.map((engine) => (
            <EngineSection key={engine.key} title={engine.label} fields={engine.fields} />
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
          <section className="executive-canvas-section rounded-xl border border-slate-200 bg-white p-3 lg:col-span-5">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-spike">
              Overall Strategy Statement
            </h4>
            <p className="text-xs leading-relaxed text-slate-800">{model.strategyStatement}</p>
          </section>

          <section className="executive-canvas-section rounded-xl border border-slate-200 bg-white p-3 lg:col-span-3">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-spike">
              90-Day Priorities
            </h4>
            <ol className="space-y-2">
              {model.priorities.map((priority, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-spike text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-800">{priority || '—'}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="executive-canvas-section rounded-xl border border-slate-200 bg-white p-3 lg:col-span-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-spike">
              3-Year Vision Snapshot
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {model.yearVision.map((item) => (
                <div key={item.year} className="rounded-lg bg-slate-50 p-2 text-center">
                  <p className="text-2xs font-semibold text-slate-500">{item.year}</p>
                  <p className="mt-1 text-xs font-bold text-slate-900">{item.goal}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
          {model.acsRoadmap ? (
            <section className="executive-canvas-section rounded-xl border border-slate-200 bg-white p-3 lg:col-span-5">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-spike">
                ACS Career Roadmap
              </h4>
              <div className="flex flex-wrap items-center gap-1">
                {model.acsRoadmap.ladder.map((step, idx) => {
                  const isCurrent = step.key === model.acsRoadmap.currentKey;
                  const isTarget = step.key === model.acsRoadmap.targetKey;
                  return (
                    <div key={step.key} className="flex items-center gap-1">
                      <span
                        className={`rounded-lg px-2 py-1 text-2xs font-bold ${
                          isCurrent
                            ? 'bg-spike text-white ring-2 ring-spike/30'
                            : isTarget
                              ? 'border-2 border-spike bg-spike-muted text-spike'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {step.label}
                      </span>
                      {idx < model.acsRoadmap.ladder.length - 1 ? (
                        <span className="text-slate-400">↓</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Readiness score:{' '}
                <span className="font-bold text-spike">{model.acsRoadmap.readinessScore}%</span>
              </p>
            </section>
          ) : null}

          <section
            className={`executive-canvas-section rounded-xl border border-slate-200 bg-white p-3 ${
              model.acsRoadmap ? 'lg:col-span-4' : 'lg:col-span-6'
            }`}
          >
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-spike">
              Key Metrics Snapshot
            </h4>
            <div className="space-y-2">
              <MetricStrip title="Client Metrics" metrics={model.metrics.client} />
              {state.career_track === 'agency_builder' ? (
                <>
                  <MetricStrip title="Recruitment Metrics" metrics={model.metrics.recruitment} />
                  <MetricStrip title="Leadership Metrics" metrics={model.metrics.leadership} />
                </>
              ) : null}
            </div>
          </section>

          <section
            className={`executive-canvas-section rounded-xl border border-slate-200 bg-gradient-to-br from-spike-muted to-white p-3 ${
              model.acsRoadmap ? 'lg:col-span-3' : 'lg:col-span-6'
            }`}
          >
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-spike">
              SPIKE Venture Readiness Score™
            </h4>
            <p className="text-3xl font-bold text-spike">{model.readiness.composite}</p>
            <div className="mt-2 space-y-1">
              {VENTURE_READINESS_WEIGHTS.map((dim) => (
                <div key={dim.key} className="flex items-center justify-between text-2xs">
                  <span className="text-slate-600">
                    {dim.label} ({dim.weight}%)
                  </span>
                  <span className="font-semibold text-slate-900">
                    {model.readiness.dimensions[dim.key]}%
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="spike-card space-y-4">
        <p className="spike-label">Edit executive fields</p>
        <p className="text-sm text-slate-600">
          Strategy, priorities, and vision goals auto-save every 2 seconds. Canvas engines update
          live from your working canvas.
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <AutoSaveField
              label="Overall Strategy Statement"
              value={summary.strategy_statement || model.strategyStatement}
              rows={4}
              onSave={handleStrategySave}
            />
            <button
              type="button"
              className="mt-2 text-sm font-semibold text-spike hover:underline"
              onClick={handleRegenerateStrategy}
            >
              Regenerate from canvas
            </button>
          </div>

          <div className="space-y-3">
            {[0, 1, 2].map((idx) => (
              <AutoSaveField
                key={idx}
                label={`Priority ${idx + 1}`}
                value={summary[`priority_${idx + 1}`] ?? ''}
                placeholder={`90-day priority ${idx + 1}…`}
                onSave={(val) => handlePrioritySave(idx, val)}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {model.yearVision.map((item, idx) => (
            <AutoSaveField
              key={item.year}
              label={`${item.year} goal`}
              value={summary[`year${idx + 1}_goal`] ?? item.goal}
              onSave={(val) => handleYearGoalSave(idx, val)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
