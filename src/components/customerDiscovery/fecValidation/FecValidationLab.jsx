import { useMemo, useState, useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import {
  approveFecStep,
  getFecStepPayload,
  getFecValidationLabState,
  isFecStepCompleteForParticipant,
} from '../../../lib/customerDiscovery/week2FecValidationService.js';
import { FEC_VALIDATION_STEPS } from '../../../lib/customerDiscovery/week2FecValidationConstants.js';
import {
  AiGeneratedBadge,
  BeforeAfterBlock,
  FecStepLock,
  FecValidationCanvas,
  SquadRolesBanner,
} from './FecValidationShared.jsx';
import { FecValidationPoster } from './FecValidationPoster.jsx';
import { hydrateParticipantFecValidation } from '../../../lib/customerDiscovery/week2FecValidationSync.js';

/**
 * @param {{ participantId: string, squadName?: string, stepSlug?: string, onSaved?: () => void, memberNames?: Record<string, string>, onNavigate?: (slug: string) => void }} props
 */
export function FecValidationLab({ participantId, squadName = '', stepSlug, onSaved, memberNames = {}, onNavigate }) {
  const [draft, setDraft] = useState('');
  const [selections, setSelections] = useState(/** @type {Record<string, unknown>} */ ({}));
  const [verdict, setVerdict] = useState('supported');
  const [, tick] = useState(0);
  const refresh = () => {
    tick((n) => n + 1);
    onSaved?.();
  };

  useEffect(() => {
    void hydrateParticipantFecValidation(participantId).then(() => refresh());
  }, [participantId]);

  const lab = useMemo(() => getFecValidationLabState(participantId), [participantId, squadName]);
  const activeSlug = stepSlug && stepSlug !== 'fec-lab' ? stepSlug : lab.activeStep.slug;
  const stepDef = FEC_VALIDATION_STEPS.find((s) => s.slug === activeSlug) ?? FEC_VALIDATION_STEPS[0];
  const stepIndex = FEC_VALIDATION_STEPS.findIndex((s) => s.slug === activeSlug);
  const prevStep = stepIndex > 0 ? FEC_VALIDATION_STEPS[stepIndex - 1] : null;
  const locked = prevStep ? !isFecStepCompleteForParticipant(participantId, prevStep.id) : false;
  const complete = isFecStepCompleteForParticipant(participantId, stepDef.id);
  const payload = useMemo(() => getFecStepPayload(participantId, stepDef.id), [participantId, stepDef.id]);

  useEffect(() => {
    setDraft('');
    setSelections({});
    setVerdict('supported');
    const saved = getFecValidationLabState(participantId).fec.steps[stepDef.id];
    if (saved?.approvedStatement) setDraft(String(saved.approvedStatement));
    if (saved?.selections) setSelections(saved.selections);
    if (saved?.verdict) setVerdict(String(saved.verdict));
  }, [participantId, stepDef.id]);

  if (!stepSlug || stepSlug === 'fec-lab') {
    return (
      <FecValidationLanding
        lab={lab}
        participantId={participantId}
        memberNames={memberNames}
        onStart={() => onNavigate?.(lab.activeStep.slug)}
      />
    );
  }

  function defaultStatementForStep() {
    switch (stepDef.id) {
      case 'fec-step-1':
        return String(payload.suggestedSummary ?? '');
      case 'fec-step-2':
        return String(payload.validatedStatement ?? '');
      case 'fec-step-3':
        return String(payload.uvpV2 ?? '');
      case 'fec-step-4':
        return String(payload.experienceStatement ?? '');
      case 'fec-step-5':
        return String(payload.strategicStatement ?? '');
      default:
        return '';
    }
  }

  function approve(statement) {
    const resolved = [statement, draft, defaultStatementForStep()]
      .map((c) => String(c ?? '').trim())
      .find(Boolean) ?? '';
    const afterText = stepDef.id === 'fec-step-3'
      ? String(draft || payload.uvpV2 || resolved).trim()
      : String(draft || defaultStatementForStep() || resolved).trim();
    approveFecStep(participantId, stepDef.id, {
      approvedStatement: resolved,
      selections: { ...selections, suggestedSummary: payload.suggestedSummary, topProblem: payload.topProblem },
      verdict,
      beforeText: String(payload.originalUvp ?? ''),
      afterText,
    });
    refresh();
  }

  return (
    <div className="space-y-6">
      <header className="spike-surface space-y-2">
        <p className="spike-label">FEC Validation Lab™ · Step {stepDef.step} of 6</p>
        <h2 className="text-xl font-bold text-slate-900">{stepDef.title}</h2>
        <p className="text-sm text-slate-600">{stepDef.subtitle}</p>
        <p className="text-xs font-semibold text-spike">Improves FEC · {stepDef.fecBoxLabel}</p>
        <SquadRolesBanner roles={lab.roles} memberNames={memberNames} currentParticipantId={participantId} />
      </header>

      <FecStepLock locked={locked} label={prevStep?.title ?? 'prior step'} />

      {!locked ? (
        <>
          {stepDef.id === 'fec-step-1' ? (
            <StepCustomerReality payload={payload} draft={draft} setDraft={setDraft} selections={selections} setSelections={setSelections} />
          ) : null}
          {stepDef.id === 'fec-step-2' ? (
            <StepProblemValidation payload={payload} draft={draft} setDraft={setDraft} selections={selections} setSelections={setSelections} />
          ) : null}
          {stepDef.id === 'fec-step-3' ? (
            <StepUvpStress payload={payload} draft={draft} setDraft={setDraft} verdict={verdict} setVerdict={setVerdict} />
          ) : null}
          {stepDef.id === 'fec-step-4' ? (
            <StepClientExperience payload={payload} draft={draft} setDraft={setDraft} />
          ) : null}
          {stepDef.id === 'fec-step-5' ? (
            <StepStrategicOpportunity payload={payload} draft={draft} setDraft={setDraft} selections={selections} setSelections={setSelections} />
          ) : null}
          {stepDef.id === 'fec-step-6' ? (
            <StepBuildPitch payload={payload} />
          ) : null}

          <FecValidationCanvas boxScores={lab.fec.boxScores} />
          <FecValidationPoster participantId={participantId} squadKey={lab.squadKey} />

          {!complete ? (
            <button
              type="button"
              onClick={() => approve()}
              className="spike-btn-primary inline-flex min-h-[44px] items-center gap-2"
            >
              <Check size={16} aria-hidden />
              Approve &amp; update FEC + Portfolio
            </button>
          ) : (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Check size={16} aria-hidden />
              Step complete — FEC and portfolio updated.
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}

/** @param {{ lab: ReturnType<typeof getFecValidationLabState>, participantId: string, memberNames: Record<string, string>, onStart: () => void }} props */
function FecValidationLanding({ lab, participantId, memberNames, onStart }) {
  const evidence = lab.evidence;
  const barPct = lab.progressPct;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-spike/20 bg-gradient-to-br from-spike/5 to-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike">Thursday · Synthesize</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">FEC Validation Lab™</h1>
        <p className="mt-1 text-sm text-slate-600">From Interviews to Venture Clarity</p>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Mission progress</span>
            <span>{barPct}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-spike transition-all" style={{ width: `${barPct}%` }} />
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-700">
          <span className="font-bold">Evidence base:</span> {evidence.interviewCount} interviews completed
          {evidence.interviewCount < evidence.target ? ` · target ${evidence.target}` : ''}
        </p>

        <SquadRolesBanner roles={lab.roles} memberNames={memberNames} currentParticipantId={participantId} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">FEC progress snapshot</h2>
        <FecValidationCanvas boxScores={lab.fec.boxScores} animate={false} />
        <FecValidationPoster participantId={participantId} squadKey={lab.squadKey} animate={false} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-slate-900">Validation steps</h2>
        <ol className="space-y-2">
          {FEC_VALIDATION_STEPS.map((step, idx) => {
            const done = isFecStepCompleteForParticipant(participantId, step.id);
            const prev = FEC_VALIDATION_STEPS[idx - 1];
            const unlocked = !prev || isFecStepCompleteForParticipant(participantId, prev.id);
            return (
              <li
                key={step.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                  done ? 'border-emerald-200 bg-emerald-50' : unlocked ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <span className="font-bold text-slate-400">{step.step}</span>
                <span className="flex-1 font-medium text-slate-900">{step.title}</span>
                {done ? <Check size={16} className="text-emerald-600" /> : null}
              </li>
            );
          })}
        </ol>
      </section>

      <button type="button" onClick={onStart} className="spike-btn-primary inline-flex min-h-[44px] items-center gap-2">
        Start validation
        <ArrowRight size={16} aria-hidden />
      </button>
    </div>
  );
}

/** @param {{ payload: Record<string, unknown>, draft: string, setDraft: (v: string) => void, selections: Record<string, unknown>, setSelections: (v: Record<string, unknown>) => void }} props */
function StepCustomerReality({ payload, draft, setDraft, selections, setSelections }) {
  const suggested = String(payload.suggestedSummary ?? '');
  const statement = draft || suggested;

  return (
    <div className="space-y-4">
      <AiGeneratedBadge>AI aggregated {payload.topQuotes?.length ?? 0} quote signals from squad interviews</AiGeneratedBadge>
      <InsightGrid title="Top quotes" items={payload.topQuotes} selectable keyName="topQuotes" selections={selections} setSelections={setSelections} max={5} />
      <InsightGrid title="Common goals" items={payload.commonGoals} selectable keyName="goals" selections={selections} setSelections={setSelections} max={3} />
      <InsightGrid title="Common concerns" items={payload.commonConcerns} selectable keyName="concerns" selections={selections} setSelections={setSelections} max={3} />
      <label className="spike-surface block space-y-2">
        <span className="text-sm font-semibold text-slate-800">Customer segment summary</span>
        <textarea
          value={statement}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-200 p-3 text-sm"
          placeholder={suggested}
        />
      </label>
    </div>
  );
}

/** @param {{ payload: Record<string, unknown>, draft: string, setDraft: (v: string) => void, selections: Record<string, unknown>, setSelections: (v: Record<string, unknown>) => void }} props */
function StepProblemValidation({ payload, draft, setDraft, selections, setSelections }) {
  const ranked = payload.rankedProblems ?? [];
  const validated = String(payload.validatedStatement ?? '');
  return (
    <div className="space-y-4">
      <AiGeneratedBadge>Most common problems from interview evidence</AiGeneratedBadge>
      <ul className="space-y-2">
        {ranked.map((p) => (
          <li key={p.text} className="flex justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <span>{p.text}</span>
            <span className="font-bold text-spike">{p.count} refs</span>
          </li>
        ))}
      </ul>
      <p className="text-sm font-semibold text-slate-800">Which problem appears most consistently?</p>
      <InsightGrid title="Top 3 problems" items={ranked.map((p) => p.text)} selectable keyName="topProblems" selections={selections} setSelections={setSelections} max={3} />
      <BeforeAfterBlock before="Assumption-based problem" after={draft || validated} title="Validated problem" />
      <textarea value={draft || validated} onChange={(e) => setDraft(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 p-3 text-sm" />
    </div>
  );
}

/** @param {{ payload: Record<string, unknown>, draft: string, setDraft: (v: string) => void, verdict: string, setVerdict: (v: string) => void }} props */
function StepUvpStress({ payload, draft, setDraft, verdict, setVerdict }) {
  const original = String(payload.originalUvp ?? '');
  const uvpV2 = String(payload.uvpV2 ?? '');
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Original UVP (Week 1)</p>
      <p className="rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-900">{original}</p>
      <p className="text-sm font-semibold">Does the evidence support this UVP?</p>
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'supported', label: '✓ Supported' },
          { id: 'partial', label: '⚠ Partially Supported' },
          { id: 'revision', label: '✗ Needs Revision' },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setVerdict(opt.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${verdict === opt.id ? 'bg-spike text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <InsightGrid title="Supporting evidence" items={payload.supporting} />
      <InsightGrid title="Conflicting evidence" items={payload.conflicting} />
      <BeforeAfterBlock before={original} after={draft || uvpV2} title="UVP Version 2" />
      <textarea value={draft || uvpV2} onChange={(e) => setDraft(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 p-3 text-sm" />
    </div>
  );
}

/** @param {{ payload: Record<string, unknown>, draft: string, setDraft: (v: string) => void }} props */
function StepClientExperience({ payload, draft, setDraft }) {
  const statement = String(payload.experienceStatement ?? '');
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-slate-800">What kind of advisor experience do customers want?</p>
      <InsightGrid title="Trust signals" items={payload.trustSignals} />
      <InsightGrid title="Communication preferences" items={payload.communicationPreferences} />
      <InsightGrid title="Service expectations" items={payload.serviceExpectations} />
      <textarea value={draft || statement} onChange={(e) => setDraft(e.target.value)} rows={4} className="w-full rounded-lg border border-slate-200 p-3 text-sm" />
    </div>
  );
}

/** @param {{ payload: Record<string, unknown>, draft: string, setDraft: (v: string) => void, selections: Record<string, unknown>, setSelections: (v: Record<string, unknown>) => void }} props */
function StepStrategicOpportunity({ payload, draft, setDraft, selections, setSelections }) {
  const opportunities = payload.opportunities ?? [];
  const statement = String(payload.strategicStatement ?? '');
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard label="Validated problem" value={payload.validatedProblem} />
        <InfoCard label="Customer segment" value={payload.customerSegment} />
        <InfoCard label="Potential impact" value={payload.potentialImpact} />
      </div>
      <InsightGrid title="Select one primary opportunity" items={opportunities} selectable keyName="opportunity" selections={selections} setSelections={setSelections} max={1} />
      <textarea value={draft || statement} onChange={(e) => setDraft(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 p-3 text-sm" />
    </div>
  );
}

/** @param {{ payload: Record<string, unknown> }} props */
function StepBuildPitch({ payload }) {
  const slides = payload.slides ?? {};
  const keys = [
    'mission', 'whoInterviewed', 'whatWeThought', 'whatWeHeard', 'customerVoices',
    'validatedProblem', 'uvpBefore', 'uvpAfter', 'strategicOpportunity', 'nextStep',
  ];
  return (
    <div className="space-y-4">
      <AiGeneratedBadge>AI draft pitch — pulled from interviews, insights, and FEC</AiGeneratedBadge>
      <p className="text-sm text-slate-600">No duplicate encoding. Review and approve to lock slides for Friday.</p>
      <div className="space-y-3">
        {keys.map((key, idx) => (
          <article key={key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase text-slate-400">Slide {idx + 1}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{key.replace(/([A-Z])/g, ' $1')}</p>
            <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{slides[key] || '—'}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

/** @param {{ title: string, items?: string[], selectable?: boolean, keyName?: string, selections?: Record<string, unknown>, setSelections?: (v: Record<string, unknown>) => void, max?: number }} props */
function InsightGrid({ title, items = [], selectable, keyName, selections, setSelections, max = 5 }) {
  const selected = keyName ? (selections?.[keyName] ?? []) : [];
  return (
    <div>
      <p className="text-xs font-bold uppercase text-slate-500">{title}</p>
      <ul className="mt-2 space-y-1">
        {items.slice(0, 12).map((item) => {
          const isOn = Array.isArray(selected) && selected.includes(item);
          return (
            <li key={item}>
              {selectable && keyName && setSelections ? (
                <button
                  type="button"
                  onClick={() => {
                    const arr = Array.isArray(selected) ? [...selected] : [];
                    const next = isOn ? arr.filter((x) => x !== item) : arr.length < max ? [...arr, item] : arr;
                    setSelections({ ...selections, [keyName]: next, suggestedSummary: selections?.suggestedSummary });
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${isOn ? 'bg-spike/10 font-semibold text-spike' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                >
                  {item}
                </button>
              ) : (
                <span className="block rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{item}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** @param {{ label: string, value?: string }} props */
function InfoCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value || '—'}</p>
    </div>
  );
}
