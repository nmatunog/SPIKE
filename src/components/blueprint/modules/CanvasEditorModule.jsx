import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LayoutTemplate } from 'lucide-react';
import { CANVAS_ENGINES } from '../../../lib/blueprintSectionConstants.js';
import {
  computeCanvasCompletionPct,
  getCanvasField,
  saveCanvasFieldDebounced,
} from '../../../lib/canvasService.js';
import { AutoSaveField } from '../AutoSaveField.jsx';
import { CircularProgress } from '../CircularProgress.jsx';
import { listBusinessPlanArtifacts } from '../../../lib/blueprintArtifacts.js';
import { ArtifactDraftCard } from '../ArtifactDraftCard.jsx';
import { BLUEPRINT_LINKS, ROUTES } from '../../../routes/paths.js';

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-3 font-bold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

/**
 * @param {{
 *   participantId: string,
 *   state?: ReturnType<import('../../../lib/participantState.js').buildParticipantState>,
 * }} props
 */
export function CanvasEditorModule({ participantId, state }) {
  const artifacts = useMemo(() => listBusinessPlanArtifacts(participantId), [participantId]);
  const canvasCompletion = computeCanvasCompletionPct(participantId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={BLUEPRINT_LINKS.businessPlan}
          className="inline-flex items-center gap-1 text-sm font-semibold text-spike hover:underline"
        >
          <ArrowLeft size={16} />
          FEC intro
        </Link>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-spike-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-600">
            Your Financial Entrepreneurship Canvas auto-saves every 2 seconds. Playbook and FNA
            work also feed chapter drafts below.
          </p>
          {state ? (
            <p className="mt-2 text-xs text-slate-500">
              Blueprint {state.blueprint_completion}% complete · Segment {state.segment}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <CircularProgress value={canvasCompletion} />
          <Link
            to={`${ROUTES.ventureBlueprint}/canvas/summary`}
            className="spike-btn-primary text-sm"
          >
            <LayoutTemplate size={16} />
            Executive Summary
          </Link>
        </div>
      </div>

      {Object.entries(CANVAS_ENGINES).map(([engineKey, engine]) => (
        <SectionCard key={engineKey} title={engine.label}>
          <div className="grid gap-4">
            {engine.fields.map((field) => (
              <AutoSaveField
                key={field.key}
                label={field.label}
                value={getCanvasField(participantId, engineKey, field.key)}
                placeholder={`Enter ${field.label.toLowerCase()}…`}
                onSave={(val) => saveCanvasFieldDebounced(participantId, engineKey, field.key, val)}
              />
            ))}
          </div>
        </SectionCard>
      ))}

      {artifacts.length > 0 ? (
        <SectionCard title="Auto-generated chapter drafts">
          <div className="space-y-3">
            {artifacts.map((a) => (
              <ArtifactDraftCard
                key={a.id}
                title={a.title}
                content={a.content}
                status={a.status}
                sourceType={a.sourceType}
                updatedAt={a.updatedAt}
              />
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
