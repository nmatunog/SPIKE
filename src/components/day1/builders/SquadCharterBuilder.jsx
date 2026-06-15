import { useState } from 'react';
import { PenLine } from 'lucide-react';
import { BuilderSubmissionFooter } from '../BuilderSubmissionFooter.jsx';
import { upsertSquadCharterDraft } from '../../../lib/squadCharterService.js';

/**
 * @param {{
 *   participantId: string,
 *   participantName: string,
 *   squadName?: string,
 *   draft: Record<string, unknown>,
 *   completed: boolean,
 *   editLocked?: boolean,
 *   refining?: boolean,
 *   completedAt?: string | null,
 *   firstCompletedAt?: string | null,
 *   canRefine?: boolean,
 *   onStartRefine?: () => void,
 *   onChange: (d: Record<string, unknown>) => void,
 *   onComplete: (d: Record<string, unknown>) => void,
 * }} props
 */
export function SquadCharterBuilder({
  participantId,
  participantName,
  squadName,
  draft,
  completed,
  editLocked = false,
  refining = false,
  completedAt,
  firstCompletedAt,
  canRefine = false,
  onStartRefine,
  onChange,
  onComplete,
}) {
  const [fields, setFields] = useState({
    squadName: String(draft.squadName ?? squadName ?? ''),
    mission: String(draft.mission ?? ''),
    teamMotto: String(draft.teamMotto ?? ''),
    teamCommitment: String(draft.teamCommitment ?? ''),
  });
  const [committed, setCommitted] = useState(Boolean(draft.signedAt) && !refining);
  const squadId = String(draft.squadId ?? 'squad-segment-1-alpha');

  function update(key, value) {
    const next = { ...fields, [key]: value };
    setFields(next);
    onChange({ ...draft, ...next, squadId });
    upsertSquadCharterDraft(squadId, { ...next, squadId });
  }

  function handleCommit() {
    const payload = {
      ...fields,
      squadId,
      signatureName: participantName,
      signedAt: new Date().toISOString(),
      participantId,
    };
    setCommitted(true);
    onComplete(payload);
  }

  const canCommit =
    fields.squadName.trim().length >= 2
    && fields.mission.trim().length >= 10
    && fields.teamMotto.trim().length >= 3
    && fields.teamCommitment.trim().length >= 10;

  return (
    <div className="space-y-6">
      <div className={`space-y-6 ${editLocked ? 'pointer-events-none opacity-75' : ''}`}>
      <section className="spike-card space-y-4">
        <h4 className="text-lg font-semibold text-slate-900">Squad Charter Builder</h4>
        <p className="text-sm text-slate-600">
          Co-create your squad charter. When all members click &quot;I Commit&quot;, the system
          generates your Official SPIKE Squad Charter PDF automatically.
        </p>

        {[
          { key: 'squadName', label: 'Squad Name', placeholder: 'NextGen Titans' },
          { key: 'mission', label: 'Mission', placeholder: 'Our squad exists to…', multiline: true },
          { key: 'teamMotto', label: 'Team Motto', placeholder: 'Learn Fast. Execute Faster.' },
          {
            key: 'teamCommitment',
            label: 'Team Commitment',
            placeholder: 'We commit to helping each other…',
            multiline: true,
          },
        ].map((field) => (
          <label key={field.key} className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-800">{field.label}</span>
            {field.multiline ? (
              <textarea
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
                value={fields[field.key]}
                placeholder={field.placeholder}
                onChange={(e) => update(field.key, e.target.value)}
              />
            ) : (
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
                value={fields[field.key]}
                placeholder={field.placeholder}
                onChange={(e) => update(field.key, e.target.value)}
              />
            )}
          </label>
        ))}
      </section>

      {(committed || completed) && !refining ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-semibold text-emerald-900">✓ Digital signature recorded</p>
          <p className="mt-1 text-sm text-emerald-800">
            Signed by {participantName}. Charter PDF generated — check your downloads.
          </p>
        </section>
      ) : (
        <button
          type="button"
          disabled={!canCommit}
          onClick={handleCommit}
          className="spike-btn-primary w-full sm:w-auto disabled:opacity-50"
        >
          <PenLine size={18} /> I Commit — Sign Charter
        </button>
      )}
      </div>

      {(committed || completed) && !refining ? (
          <BuilderSubmissionFooter
            completed={completed}
            editLocked={editLocked}
            completedAt={completedAt}
            firstCompletedAt={firstCompletedAt}
            canRefine={canRefine}
            onStartRefine={onStartRefine}
            completeLabel="I Commit — Sign Charter"
            updateLabel="Update Charter"
            savedLabel="Charter saved to your portfolio"
            onComplete={handleCommit}
          />
      ) : null}
    </div>
  );
}
