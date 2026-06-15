import { useState } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCohortHydration } from '../../hooks/useParticipantHydration.js';
import { summarizeCohortDay1Outputs } from '../../lib/day1Outputs.js';
import { ROUTES, mentorParticipantReviewHref } from '../../routes/paths.js';

/**
 * Cohort table of Day 1 venture identity outputs for mentors and program coaches.
 * @param {{
 *   interns: Array<{ id: string, name: string, squad?: string }>,
 *   viewerRole?: 'mentor' | 'faculty',
 * }} props
 */
export function Day1CohortOutputsPanel({ interns, viewerRole = 'faculty' }) {
  const ids = interns.map((i) => i.id);
  const { ready, version } = useCohortHydration(ids, { enabled: interns.length > 0, interns });
  void version;

  const summary = ready ? summarizeCohortDay1Outputs(interns) : null;
  const [expandedId, setExpandedId] = useState(null);

  return (
    <section className="spike-card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Day 1 outputs — Venture Identity</h3>
          <p className="mt-1 text-xs text-slate-500">
            Ambition, impact, values, and builders synced from intern devices to the cloud.
          </p>
        </div>
        {summary ? (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-spike-muted px-2.5 py-1 font-semibold text-spike">
              {summary.withOutputs}/{summary.total} with outputs
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
              {summary.avgProgress}% avg builders
            </span>
          </div>
        ) : null}
      </div>

      {!ready ? (
        <p className="text-sm text-slate-500">Loading Day 1 work from the cloud…</p>
      ) : !summary?.rows.length ? (
        <p className="text-sm text-slate-500">No participants in this cohort yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-2xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Participant</th>
                <th className="py-2 pr-3">Squad</th>
                <th className="py-2 pr-3">D1</th>
                <th className="py-2 pr-3">Ambition</th>
                <th className="py-2 pr-3">Impact</th>
                <th className="py-2 pr-3">Values</th>
                <th className="py-2 pr-3">Tagline</th>
                <th className="py-2 pr-3">Dream board</th>
                <th className="py-2 pr-3">Charter</th>
                <th className="py-2"> </th>
              </tr>
            </thead>
            <tbody>
              {summary.rows.map(({ intern, outputs }) => {
                const expanded = expandedId === intern.id;
                return (
                  <Day1OutputRow
                    key={intern.id}
                    intern={intern}
                    outputs={outputs}
                    expanded={expanded}
                    viewerRole={viewerRole}
                    onToggle={() => setExpandedId(expanded ? null : intern.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/**
 * @param {{
 *   intern: { id: string, name: string, squad?: string },
 *   outputs: ReturnType<import('../../lib/day1Outputs.js').getParticipantDay1Outputs>,
 *   expanded: boolean,
 *   viewerRole: 'mentor' | 'faculty',
 *   onToggle: () => void,
 * }} props
 */
function Day1OutputRow({ intern, outputs, expanded, viewerRole, onToggle }) {
  const reviewHref = mentorParticipantReviewHref(intern.id);
  void viewerRole;

  return (
    <>
      <tr className="border-b border-slate-100 align-top">
        <td className="py-3 pr-3 font-medium text-slate-900">{intern.name}</td>
        <td className="py-3 pr-3 text-xs text-slate-600">
          {outputs.squadName || intern.squad?.trim() || '—'}
        </td>
        <td className="py-3 pr-3">
          <span className="rounded-full bg-spike-muted px-2 py-0.5 text-xs font-bold text-spike">
            {outputs.progressPercent}%
          </span>
        </td>
        <td className="max-w-[10rem] py-3 pr-3">
          <OutputCell text={outputs.preview.ambition} full={outputs.ambition} />
        </td>
        <td className="max-w-[10rem] py-3 pr-3">
          <OutputCell text={outputs.preview.impact} full={outputs.impact} />
        </td>
        <td className="max-w-[10rem] py-3 pr-3">
          <OutputCell text={outputs.preview.values} full={outputs.values} />
        </td>
        <td className="max-w-[8rem] py-3 pr-3">
          <OutputCell text={outputs.preview.tagline} full={outputs.tagline} />
        </td>
        <td className="py-3 pr-3">
          {outputs.dreamBoardDone ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <CheckCircle size={14} /> {outputs.dreamBoardCount || 'Done'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Clock size={14} /> Pending
            </span>
          )}
        </td>
        <td className="py-3 pr-3">
          {outputs.charterDone ? (
            <span className="text-xs font-semibold text-emerald-700">Signed</span>
          ) : (
            <span className="text-xs text-slate-400">Pending</span>
          )}
        </td>
        <td className="py-3">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-spike hover:underline"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'Less' : 'More'}
            </button>
            <Link
              to={reviewHref}
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-slate-600 hover:text-spike"
            >
              <ExternalLink size={12} /> Review
            </Link>
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-slate-100 bg-slate-50/80">
          <td colSpan={10} className="px-3 py-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <DetailBlock label="Ambition" text={outputs.ambition} />
              <DetailBlock label="Impact" text={outputs.impact} />
              <DetailBlock label="Values" text={outputs.values} />
              <DetailBlock label="Tagline" text={outputs.tagline} />
              <DetailBlock label="Future self" text={outputs.futureSelf} />
              <DetailBlock label="Career direction" text={outputs.careerDirection} />
              <DetailBlock label="Squad markets" text={outputs.squadMarkets} />
              <DetailBlock
                label="Squad charter"
                text={outputs.charterDone ? outputs.charterSquadName || 'Signed' : 'Not signed yet'}
              />
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** @param {{ text: string, full: string }} props */
function OutputCell({ text, full }) {
  if (!text) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  return (
    <p className="line-clamp-2 text-xs text-slate-700" title={full}>
      {text}
    </p>
  );
}

/** @param {{ label: string, text: string }} props */
function DetailBlock({ label, text }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="spike-label">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
        {text?.trim() ? text : '—'}
      </p>
    </div>
  );
}
