import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Award, Check, Mic, MicOff, Sparkles } from 'lucide-react';
import {
  approveReadinessReflection,
  ensureWednesdaySquadRoles,
  generateReadinessReflectionSummary,
  getReadinessMissionState,
  savePctcStatus,
  saveReadinessReflectionAnswers,
  saveUvpCheckpoint,
} from '../../lib/customerDiscovery/week2ReadinessMissionService.js';
import { hydrateParticipantWeek2Discovery, syncWeek2DiscoveryToCloud } from '../../lib/customerDiscovery/week2DiscoverySync.js';
import { Week2SyncStatus } from './Week2SyncStatus.jsx';
import { getParticipantSquad } from '../../lib/cohortFormationService.js';
import { getFecValidationLabState } from '../../lib/customerDiscovery/week2FecValidationService.js';
import { SQUAD_ROLE_DEFS } from '../../lib/customerDiscovery/week2FecValidationConstants.js';

const REFLECTION_PROMPTS = [
  { key: 'surprised', title: 'What surprised you most?' },
  { key: 'responsibility', title: 'What responsibility stood out to you?' },
  { key: 'trustedAdvisor', title: 'What makes a trusted advisor different?' },
];

/**
 * Week 2 Day 3 — Professional Readiness Mission (full bridge experience).
 * @param {{ participantId: string, squadName?: string, onSaved?: () => void, onContinueThursday?: () => void }} props
 */
export function ProfessionalReadinessMission({ participantId, onSaved, onContinueThursday }) {
  const [, tick] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncTick, setSyncTick] = useState(0);
  const [recordingKey, setRecordingKey] = useState(/** @type {string | null} */ (null));

  const refresh = () => {
    tick((n) => n + 1);
    onSaved?.();
  };

  useEffect(() => {
    void hydrateParticipantWeek2Discovery(participantId).then(() => refresh());
    ensureWednesdaySquadRoles(participantId);
  }, [participantId]);

  const mission = useMemo(() => getReadinessMissionState(participantId), [participantId, tick]);
  const fecLab = useMemo(() => getFecValidationLabState(participantId), [participantId, tick]);
  const roles = fecLab.roles ?? {};
  const squad = useMemo(() => getParticipantSquad(participantId), [participantId]);
  const roleLabel = (roleId) => {
    const ownerId = roles[roleId];
    if (!ownerId) return 'Unassigned';
    if (ownerId === participantId) return 'You';
    const member = squad?.members?.find((m) => m.participantId === ownerId);
    return member?.displayName || member?.participantId?.slice(0, 8) || 'Squad member';
  };

  const [evidence, setEvidence] = useState(mission.state.readinessEvidenceNote ?? '');
  const [answers, setAnswers] = useState(mission.answers);
  const [summary, setSummary] = useState(mission.reflectionSummary);
  const [uvpNotes, setUvpNotes] = useState(mission.uvpNotes);

  useEffect(() => {
    setEvidence(mission.state.readinessEvidenceNote ?? '');
    setAnswers(mission.answers);
    setSummary(mission.reflectionSummary);
    setUvpNotes(mission.uvpNotes);
  }, [participantId, tick]);

  async function cloudSave() {
    setSyncing(true);
    try {
      await syncWeek2DiscoveryToCloud(participantId, mission.state);
    } finally {
      setSyncing(false);
      setSyncTick((n) => n + 1);
    }
  }

  function pctcStatusLabel() {
    if (mission.pctcComplete) return 'Completed';
    if (mission.pctcStarted) return 'In Progress';
    return 'Not Started';
  }

  function startVoice(key) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-PH';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setRecordingKey(key);
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? '';
      const next = { ...answers, [key]: `${answers[key] ?? ''} ${text}`.trim() };
      setAnswers(next);
      saveReadinessReflectionAnswers(participantId, next);
      refresh();
    };
    rec.onend = () => setRecordingKey(null);
    rec.onerror = () => setRecordingKey(null);
    rec.start();
  }

  return (
    <div className="space-y-10 pb-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl border border-spike/25 bg-gradient-to-br from-slate-900 via-slate-900 to-spike-dark p-6 text-white shadow-lg sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike-light/80">Week 2 · Day 3 · Learn</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Professional Readiness Mission</h1>
        <p className="mt-2 text-lg text-slate-300">Today you prepare to serve.</p>
        <blockquote className="mt-4 border-l-2 border-spike pl-4 text-sm leading-relaxed text-slate-200">
          Helping people make financial decisions is a privilege.
          <br />
          Privileges require preparation.
        </blockquote>

        <div className="mt-6">
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>Mission progress</span>
            <span>{mission.missionPct}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-spike transition-all" style={{ width: `${mission.missionPct}%` }} />
          </div>
        </div>

        <ul className="mt-4 flex flex-wrap gap-2">
          {mission.steps.map((step) => (
            <li
              key={step.id}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                step.done ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-slate-300'
              }`}
            >
              {step.done ? <Check size={12} /> : <span className="opacity-60">□</span>}
              {step.label}
            </li>
          ))}
        </ul>
      </section>

      <Week2SyncStatus participantId={participantId} syncing={syncing} refreshKey={syncTick} />

      {/* Section 1 — PCTC */}
      <MissionSection title="AIA Pre-Contract Training Course" subtitle="Complete your professional preparation — then continue the venture journey.">
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoTile label="Status" value={pctcStatusLabel()} highlight={mission.pctcComplete} />
          <InfoTile label="Estimated time" value="~4 hours" />
          {mission.pctcComplete ? (
            <InfoTile label="Completed" value={new Date(mission.state.professionalReadinessAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} />
          ) : null}
          {mission.badgeEarned ? (
            <InfoTile label="Badge" value="Professional Readiness ✓" highlight />
          ) : null}
        </div>

        <p className="text-sm text-slate-600">
          Complete the AIA LMS Pre-Contract Training Course, then record your completion evidence below.
        </p>

        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400">Completion evidence</span>
          <textarea
            value={evidence}
            rows={3}
            onChange={(e) => {
              setEvidence(e.target.value);
              const status = e.target.value.trim().length > 10 ? 'completed' : 'in_progress';
              savePctcStatus(participantId, status, e.target.value);
              refresh();
            }}
            placeholder="e.g. Completed Modules 1–4 on AIA LMS · certificate ref #…"
            className="w-full rounded-xl border border-slate-200 p-4 text-sm focus:border-spike focus:outline-none focus:ring-1 focus:ring-spike"
          />
        </label>

        {!mission.pctcComplete ? (
          <button
            type="button"
            onClick={() => {
              savePctcStatus(participantId, 'in_progress', evidence);
              refresh();
            }}
            className="spike-btn-secondary text-sm"
          >
            Mark PCTC in progress
          </button>
        ) : (
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Award size={16} /> PCTC complete — reflection unlocked below
          </p>
        )}
      </MissionSection>

      {/* Section 2 — Reflection */}
      {mission.pctcComplete ? (
        <MissionSection title="Professional Readiness Reflection" subtitle="Connect licensing preparation with customer responsibility.">
          <div className="space-y-4">
            {REFLECTION_PROMPTS.map((p) => (
              <article key={p.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="font-semibold text-slate-900">{p.title}</p>
                <textarea
                  value={answers[p.key] ?? ''}
                  rows={3}
                  onChange={(e) => {
                    const next = { ...answers, [p.key]: e.target.value };
                    setAnswers(next);
                    saveReadinessReflectionAnswers(participantId, next);
                    refresh();
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm focus:border-spike focus:outline-none"
                  placeholder="Type your reflection…"
                />
                <button
                  type="button"
                  onClick={() => startVoice(p.key)}
                  disabled={recordingKey === p.key}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-spike hover:underline disabled:opacity-50"
                >
                  {recordingKey === p.key ? <MicOff size={14} /> : <Mic size={14} />}
                  {recordingKey === p.key ? 'Listening…' : 'Voice note (transcribes to text)'}
                </button>
              </article>
            ))}
          </div>

          <div className="rounded-xl border border-spike/20 bg-spike/5 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-spike">
              <Sparkles size={16} /> AI Reflection Summary
            </p>
            <textarea
              value={summary}
              rows={3}
              onChange={(e) => setSummary(e.target.value)}
              className="mt-2 w-full rounded-lg border border-spike/10 bg-white p-3 text-sm"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="spike-btn-secondary text-sm"
                onClick={() => {
                  const gen = generateReadinessReflectionSummary(participantId);
                  setSummary(gen);
                  refresh();
                }}
              >
                Generate summary
              </button>
              <button
                type="button"
                className="spike-btn-primary text-sm"
                onClick={() => {
                  approveReadinessReflection(participantId, summary);
                  void cloudSave();
                  refresh();
                }}
              >
                Approve &amp; save to portfolio
              </button>
            </div>
          </div>
        </MissionSection>
      ) : (
        <LockedSection title="Professional Readiness Reflection" hint="Complete PCTC to unlock reflection." />
      )}

      {/* Section 3 — Interview Intelligence */}
      <MissionSection title="Interview Intelligence Board" subtitle="Auto-aggregated from squad interviews — no re-encoding.">
        <p className="text-lg font-bold text-slate-900">
          {mission.evidence.interviewCount} / {mission.evidence.target} interviews complete
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <InsightCard title="Top customer quotes" items={mission.board.mostCommonQuotes?.slice(0, 4)} />
          <InsightCard title="Top customer problems" items={mission.board.mostCommonChallenges?.slice(0, 4)} />
          <InsightCard title="Top customer goals" items={mission.board.mostCommonGoals?.slice(0, 4)} />
          <InsightCard title="Most common themes" items={mission.board.mostCommonRisks?.slice(0, 3)} />
          <InsightCard title="Emerging opportunity" items={mission.board.emergingOpportunities?.slice(0, 2)} className="sm:col-span-2" />
        </div>
      </MissionSection>

      {/* Section 4 — UVP Checkpoint */}
      {mission.reflectionApproved ? (
        <MissionSection title="UVP Checkpoint" subtitle="Bridge to Thursday — does the market support your UVP?">
          <div className="grid gap-4 lg:grid-cols-2">
            <blockquote className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
              <p className="text-xs font-bold uppercase text-slate-400">Original UVP</p>
              <p className="mt-2 font-medium">{mission.originalUvp}</p>
            </blockquote>
            <div className="rounded-xl border border-venture-discover/20 bg-venture-discover/5 p-4 text-sm">
              <p className="text-xs font-bold uppercase text-venture-discover">What the market is saying</p>
              <ul className="mt-2 space-y-1 text-slate-700">
                {(mission.marketSignals.conflicting ?? []).slice(0, 2).map((t) => (
                  <li key={t}>• {t}</li>
                ))}
                {(mission.marketSignals.quotes ?? []).slice(0, 2).map((t) => (
                  <li key={t} className="italic">&ldquo;{t}&rdquo;</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-base font-bold text-slate-900">Does the evidence support our UVP?</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'supported', label: '✓ Supported' },
              { id: 'refinement', label: '⚠ Needs Refinement' },
              { id: 'revision', label: '✗ Needs Revision' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  saveUvpCheckpoint(participantId, {
                    verdict: opt.id,
                    notes: uvpNotes,
                    originalUvp: mission.originalUvp,
                  });
                  void cloudSave();
                  refresh();
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  mission.uvpVerdict === opt.id ? 'bg-spike text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <textarea
            value={uvpNotes}
            rows={2}
            onChange={(e) => setUvpNotes(e.target.value)}
            onBlur={() => {
              if (mission.uvpVerdict) {
                saveUvpCheckpoint(participantId, {
                  verdict: mission.uvpVerdict,
                  notes: uvpNotes,
                  originalUvp: mission.originalUvp,
                });
                refresh();
              }
            }}
            placeholder="Optional — why?"
            className="w-full rounded-lg border border-slate-200 p-3 text-sm"
          />
        </MissionSection>
      ) : (
        <LockedSection title="UVP Checkpoint" hint="Approve your reflection to unlock the UVP checkpoint." />
      )}

      {/* Section 5 — Thursday Readiness */}
      <MissionSection title="FEC Validation Lab Readiness" subtitle="Your bridge to Thursday synthesis.">
        <p className="text-4xl font-black text-spike">{mission.readinessPct}%</p>
        <ul className="mt-4 space-y-2">
          {mission.contributors.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-sm">
              {c.done ? <Check size={16} className="text-emerald-600" /> : <span className="w-4 text-slate-300">○</span>}
              <span className={c.done ? 'font-medium text-slate-900' : 'text-slate-600'}>{c.label}</span>
            </li>
          ))}
        </ul>

        {mission.thursdayUnlocked ? (
          <button
            type="button"
            onClick={() => onContinueThursday?.()}
            className="spike-btn-primary mt-6 inline-flex min-h-[48px] items-center gap-2"
          >
            Continue to Thursday
            <ArrowRight size={18} />
          </button>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Reach 75% readiness to unlock FEC Validation Lab™.</p>
        )}
      </MissionSection>

      {/* Wednesday squad roles */}
      <MissionSection title="Squad roles — Wednesday PM" subtitle="Visible throughout Week 2.">
        <ul className="grid gap-2 sm:grid-cols-3">
          {SQUAD_ROLE_DEFS.map((def) => (
            <li key={def.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <p className="font-bold text-slate-900">{def.label}</p>
              <p className="text-xs text-slate-500">{def.responsibility}</p>
              <p className="mt-1 text-xs font-medium text-spike">{roleLabel(def.id)}</p>
            </li>
          ))}
        </ul>
      </MissionSection>
    </div>
  );
}

/** @param {{ title: string, subtitle?: string, children: import('react').ReactNode }} props */
function MissionSection({ title, subtitle, children }) {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

/** @param {{ title: string, hint: string }} props */
function LockedSection({ title, hint }) {
  return (
    <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </section>
  );
}

/** @param {{ label: string, value: string, highlight?: boolean }} props */
function InfoTile({ label, value, highlight }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

/** @param {{ title: string, items?: string[], className?: string }} props */
function InsightCard({ title, items = [], className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p>
      {items.length ? (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li key={item} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-400">Encode more interviews to populate.</p>
      )}
    </div>
  );
}
