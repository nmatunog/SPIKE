import { getParticipantWeek1Outputs, week1OutputCompletionPct } from '../../lib/mentorFrameworkService.js';
import { computeCanvasCompletionPct } from '../../lib/canvasService.js';
import { generateVenturePortfolio } from '../../services/portfolioGenerator.js';

const OUTPUT_ROWS = [
  { key: 'ambition', label: 'Ambition' },
  { key: 'impact', label: 'Impact' },
  { key: 'values', label: 'Values' },
  { key: 'futureSelf', label: 'Future Self' },
  { key: 'careerDirection', label: 'Career Direction' },
  { key: 'squadMembership', label: 'Squad Membership' },
  { key: 'squadCharter', label: 'Squad Charter' },
  { key: 'dreamBoard', label: 'Dream Board' },
  { key: 'feCanvas', label: 'FE Canvas v1' },
  { key: 'portfolio', label: 'Portfolio v1' },
];

/**
 * @param {{ participantId: string, participantName?: string }} props
 */
export function MentorParticipantOutputs({ participantId, participantName = 'Participant' }) {
  const outputs = getParticipantWeek1Outputs(participantId);
  const pct = week1OutputCompletionPct(outputs);
  const portfolio = generateVenturePortfolio(participantId, { participantName });
  const canvasPct = computeCanvasCompletionPct(participantId);

  return (
    <div className="spike-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Current outputs</h3>
        <span className="rounded-full bg-spike-muted px-2.5 py-1 text-xs font-bold text-spike">{pct}% Week 1</span>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {OUTPUT_ROWS.map((row) => (
          <li
            key={row.key}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              outputs[row.key] ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-50 text-slate-600'
            }`}
          >
            <span>{row.label}</span>
            <span className="font-semibold">{outputs[row.key] ? '✓' : '—'}</span>
          </li>
        ))}
      </ul>

      <dl className="grid gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600 sm:grid-cols-3">
        <div>
          <dt className="font-semibold">Portfolio</dt>
          <dd>{portfolio.cover.portfolioCompletion}%</dd>
        </div>
        <div>
          <dt className="font-semibold">Canvas</dt>
          <dd>{canvasPct}%</dd>
        </div>
        <div>
          <dt className="font-semibold">Dream cards</dt>
          <dd>{portfolio.dreamBoard.assets.length}</dd>
        </div>
      </dl>
    </div>
  );
}
