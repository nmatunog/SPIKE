import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import {
  DEFAULT_COMMITMENT,
  getOfficialCohort,
  getParticipantSquad,
  getSquadCharter,
  getThemeItem,
  RESEARCH_MARKETS,
  signSquadCharter,
  updateSquadCharter,
} from '../../lib/cohortFormationService.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ participantId: string, participantName: string }} props
 */
export function SquadCharterPage({ participantId, participantName }) {
  const squad = getParticipantSquad(participantId);
  const cohort = getOfficialCohort();
  const charter = squad ? getSquadCharter(squad.id) : null;
  const item = squad ? getThemeItem(String(squad.themeItemId)) : null;
  const market = squad
    ? RESEARCH_MARKETS.find((m) => m.id === squad.researchMarket)?.label
    : null;

  const [motto, setMotto] = useState(charter?.motto ?? cohort?.motto ?? '');
  const [commitment, setCommitment] = useState(
    charter?.commitment_statement ?? DEFAULT_COMMITMENT,
  );

  if (!squad) {
    return (
      <PageContainer>
        <p className="spike-card text-sm text-slate-600">
          Join a squad first.{' '}
          <Link to={ROUTES.squad} className="font-semibold text-spike hover:underline">
            Squad dashboard
          </Link>
        </p>
      </PageContainer>
    );
  }

  const hasSigned = charter?.signatures?.some((s) => s.participantId === participantId);
  const allSigned =
    charter?.signatures?.length >= (squad.members?.length ?? 0)
    && (charter?.status === 'complete' || charter?.status === 'approved');

  function handleSaveFields() {
    updateSquadCharter(squad.id, { motto, commitment_statement: commitment });
  }

  function handleSign() {
    handleSaveFields();
    signSquadCharter(squad.id, participantId, participantName);
    window.location.reload();
  }

  return (
    <PageContainer wide>
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <p className="spike-label text-spike">Squad Charter Builder</p>
          <h1 className="text-2xl font-bold text-slate-900">{squad.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {cohort ? `Cohort ${cohort.name} · ` : ''}
            {item?.name} · {market}
          </p>
        </header>

        <section className="spike-card space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Squad Motto</span>
            <input
              type="text"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              onBlur={handleSaveFields}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Commitment Statement</span>
            <textarea
              rows={4}
              value={commitment}
              onChange={(e) => setCommitment(e.target.value)}
              onBlur={handleSaveFields}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>
        </section>

        <section className="spike-card">
          <p className="spike-label">Signatures ({charter?.signatures?.length ?? 0}/{squad.members?.length ?? 0})</p>
          <ul className="mt-2 space-y-1 text-sm">
            {(squad.members ?? []).map((m) => {
              const sig = charter?.signatures?.find((s) => s.participantId === m.participantId);
              return (
                <li key={m.participantId}>
                  {sig ? '✓' : '○'} {m.role}
                  {m.participantId === participantId ? ' (you)' : ''}
                </li>
              );
            })}
          </ul>
        </section>

        {!hasSigned ? (
          <button type="button" onClick={handleSign} className="spike-btn-primary w-full sm:w-auto">
            <PenLine size={18} /> I Commit — Sign Charter
          </button>
        ) : (
          <p className="text-sm font-semibold text-emerald-700">✓ Your signature is recorded</p>
        )}

        {allSigned ? (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            All members signed — charter PDF generated. Check your downloads folder.
          </p>
        ) : null}

        <Link to={ROUTES.squad} className="inline-flex spike-btn-secondary">
          Back to squad dashboard
        </Link>
      </div>
    </PageContainer>
  );
}
