import { useMemo } from 'react';
import { listFecV2EntryFields } from '../../../lib/fecCanvasConstants.js';
import {
  getFecField,
  getFecSummaryField,
  saveFecFieldDebounced,
  saveFecSummaryField,
} from '../../../lib/fecCanvasService.js';
import { buildFecReadinessSummary } from '../../../lib/week5Day1/service.js';
import { PlaybookMissionField } from '../shared/PlaybookMissionField.jsx';

const READINESS_LABELS = {
  strong: 'Strong',
  missing: 'Missing evidence',
  'needs-clarification': 'Needs clarification',
  'needs-numbers': 'Needs numbers',
};

/**
 * @param {{
 *   participantId: string,
 *   pitchLocks: Record<string, boolean>,
 *   onToggleLock: (fieldKey: string, locked: boolean) => void,
 *   readOnly?: boolean,
 *   onSaved?: () => void,
 * }} props
 */
export function Week5FecCanvasReviewPanel({
  participantId,
  pitchLocks,
  onToggleLock,
  readOnly = false,
  onSaved,
}) {
  const fields = useMemo(() => listFecV2EntryFields(), []);
  const readiness = useMemo(() => buildFecReadinessSummary(participantId), [participantId]);

  function readValue(entry) {
    if (entry.engineKey === 'summary') {
      return String(getFecSummaryField(participantId, entry.fieldKey) ?? '');
    }
    return getFecField(participantId, entry.engineKey, entry.fieldKey);
  }

  function writeValue(entry, value) {
    if (readOnly || pitchLocks[entry.fieldKey]) return;
    if (entry.engineKey === 'summary') {
      saveFecSummaryField(participantId, { [entry.fieldKey]: value });
    } else {
      saveFecFieldDebounced(participantId, entry.engineKey, entry.fieldKey, value);
    }
    onSaved?.();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Review your complete Financial Entrepreneurship Canvas. Lock for Pitch is a personal editing flag — you can unlock and revise anytime.
      </p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(readiness).slice(0, 8).map(([key, status]) => (
          <span
            key={key}
            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-2xs font-semibold text-slate-600"
          >
            {key}: {READINESS_LABELS[status] ?? status}
          </span>
        ))}
      </div>
      <div className="space-y-3">
        {fields.map((entry) => {
          const locked = Boolean(pitchLocks[entry.fieldKey]);
          const value = readValue(entry);
          return (
            <div key={`${entry.engineKey}-${entry.fieldKey}`} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
                {!readOnly ? (
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={locked}
                      onChange={(e) => onToggleLock(entry.fieldKey, e.target.checked)}
                    />
                    Lock for Pitch
                  </label>
                ) : null}
              </div>
              <PlaybookMissionField
                fieldId={`fec-${entry.fieldKey}`}
                label=""
                value={value}
                readOnly={readOnly || locked}
                onChange={(v) => writeValue(entry, v)}
              />
              <p className="mt-1 text-2xs text-slate-500">
                Status: {READINESS_LABELS[readiness[entry.fieldKey]] ?? 'Ready for pitch'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
