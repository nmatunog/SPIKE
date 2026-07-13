import { useCallback, useState } from 'react';
import { usePlaybookMissionAutosave } from '../../../hooks/usePlaybookMissionAutosave.js';
import {
  computePitchDuration,
  loadWeek5Day2Mission,
  saveWeek5Day2Mission,
} from '../../../lib/week5Day2/storage.js';
import { PlaybookAutosaveStatus } from '../shared/PlaybookAutosaveStatus.jsx';
import { PlaybookCoachingList } from '../shared/PlaybookCoachingList.jsx';
import { PlaybookMissionField } from '../shared/PlaybookMissionField.jsx';

const CARD = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';

const DAY2_SECTIONS = [
  {
    id: 'one-message',
    title: 'The One Big Message',
    prompt: 'What is the one idea you want the panel to remember?',
    coaching: [
      'What is the central argument of the pitch?',
      'Why should the venture exist?',
      'What makes this opportunity important now?',
      'Can this be expressed in one sentence?',
    ],
    fields: [
      { id: 'mainPitchMessage', label: 'Main message' },
      { id: 'supportingStatement', label: 'Supporting statement' },
      { id: 'openingLine', label: 'Suggested opening line' },
      { id: 'closingLine', label: 'Suggested closing line' },
      { id: 'oneMessageNotes', label: 'Notes' },
    ],
  },
  {
    id: 'audience',
    title: 'The Pitch Audience',
    prompt: 'What does the panel need to believe before they support the venture?',
    kind: 'panel-audience',
  },
  { id: 'storyboard', title: 'Pitch Story Structure', kind: 'storyboard' },
  {
    id: 'opening',
    title: 'Opening the Pitch',
    prompt: 'How will you earn the panel’s attention in the first thirty seconds?',
    fields: [
      { id: 'openingOption1', label: 'Opening option 1' },
      { id: 'openingOption2', label: 'Opening option 2' },
      { id: 'openingSelected', label: 'Selected opening' },
      { id: 'openingWhy', label: 'Why it works' },
      { id: 'openingVisual', label: 'Supporting visual' },
      { id: 'openingNotes', label: 'Notes' },
    ],
  },
  {
    id: 'problem-pitch',
    title: 'Presenting the Problem',
    fields: [
      { id: 'pitchProblemNarrative', label: 'Problem narrative' },
      { id: 'pitchCustomerExample', label: 'Customer example' },
      { id: 'pitchProblemEvidence', label: 'Evidence' },
      { id: 'pitchKeyQuote', label: 'Key quote' },
      { id: 'pitchKeyNumber', label: 'Key number' },
      { id: 'pitchCostOfInaction', label: 'Cost of inaction' },
      { id: 'pitchProblemNotes', label: 'Notes' },
    ],
  },
  {
    id: 'venture-pitch',
    title: 'Presenting the Venture',
    fields: [
      { id: 'pitchVentureDescription', label: 'Venture description' },
      { id: 'pitchCustomerOutcome', label: 'Customer outcome' },
      { id: 'pitchCoreService', label: 'Core service' },
      { id: 'pitchAdvisorRole', label: 'Advisor role' },
      { id: 'pitchAiaRole', label: 'AIA platform role' },
      { id: 'pitchDifferentiator', label: 'Differentiator' },
      { id: 'pitchVentureNotes', label: 'Notes' },
    ],
  },
  {
    id: 'business-model',
    title: 'Presenting the Business Model',
    fields: [
      { id: 'pitchAcquisitionModel', label: 'Acquisition model' },
      { id: 'pitchActivityModel', label: 'Activity model' },
      { id: 'pitchRevenueModel', label: 'Revenue model' },
      { id: 'pitchResourcesRequired', label: 'Resources required' },
      { id: 'pitchKeyAssumptions', label: 'Key assumptions' },
      { id: 'pitchModelEvidence', label: 'Supporting evidence' },
      { id: 'pitchModelNotes', label: 'Notes' },
    ],
  },
  {
    id: 'revenue-growth',
    title: 'Presenting Revenue and Growth',
    fields: [
      { id: 'pitchKeyNumber1', label: 'Key number 1' },
      { id: 'pitchKeyNumber2', label: 'Key number 2' },
      { id: 'pitchKeyNumber3', label: 'Key number 3' },
      { id: 'pitchYear1', label: 'Year 1 projection' },
      { id: 'pitchYear2', label: 'Year 2 projection' },
      { id: 'pitchYear3', label: 'Year 3 projection' },
      { id: 'pitchConservativeCase', label: 'Conservative case' },
      { id: 'pitchGrowthExplanation', label: 'Growth explanation' },
      { id: 'pitchLeadershipExplanation', label: 'Leadership explanation' },
      { id: 'pitchRevenueNotes', label: 'Notes' },
    ],
  },
  {
    id: 'why-aia',
    title: 'Why AIA',
    fields: [
      { id: 'aiaBrand', label: 'Brand advantage' },
      { id: 'aiaProduct', label: 'Product advantage' },
      { id: 'aiaTechnology', label: 'Technology advantage' },
      { id: 'aiaTraining', label: 'Training advantage' },
      { id: 'aiaLeadership', label: 'Leadership advantage' },
      { id: 'aiaCompliance', label: 'Compliance advantage' },
      { id: 'aiaDistribution', label: 'Distribution advantage' },
      { id: 'aiaNotes', label: 'Notes' },
    ],
  },
  {
    id: 'why-squad',
    title: 'Why This Squad',
    fields: [
      { id: 'squadStrength', label: 'Squad strength' },
      { id: 'squadLearningEvidence', label: 'Evidence of learning' },
      { id: 'squadAdaptationEvidence', label: 'Evidence of adaptation' },
      { id: 'squadResponsibilities', label: 'Member responsibilities' },
      { id: 'squadWeakness', label: 'Current weakness' },
      { id: 'squadNextStep', label: 'Immediate next step' },
      { id: 'squadCommitment', label: 'Commitment statement' },
      { id: 'squadNotes', label: 'Notes' },
    ],
  },
  { id: 'panel-bank', title: 'Panel Challenge Bank', kind: 'panel-bank' },
  { id: 'speaker-plan', title: 'Speaker and Timing Plan', kind: 'speaker-plan' },
  { id: 'slide-plan', title: 'Slide Planning', kind: 'slide-plan' },
  { id: 'readiness', title: 'Pitch Readiness Review', kind: 'readiness' },
  {
    id: 'reflection',
    title: 'Day 2 Reflection',
    kind: 'reflection',
    prompts: [
      'What is the strongest part of your pitch?',
      'What is the weakest part?',
      'What claim still needs evidence?',
      'What number still needs review?',
      'What question are you most concerned the panel will ask?',
      'What will the squad complete before the final pitch?',
      'What personal commitment will you make for the presentation?',
    ],
  },
];

/**
 * @param {{ participantId: string, readOnly?: boolean, onProgress?: () => void }} props
 */
export function Week5Day2MissionFlow({ participantId, readOnly = false, onProgress }) {
  const [state, setState] = useState(() => loadWeek5Day2Mission(participantId));
  const [activeId, setActiveId] = useState(DAY2_SECTIONS[0].id);

  const persist = useCallback(
    (mutate) => {
      if (readOnly) return;
      setState((prev) => {
        const next = saveWeek5Day2Mission(participantId, mutate(prev));
        onProgress?.();
        return next;
      });
    },
    [participantId, readOnly, onProgress],
  );

  const { status, markDirty } = usePlaybookMissionAutosave(
    state,
    (next) => {
      if (!readOnly) saveWeek5Day2Mission(participantId, next);
    },
    { enabled: !readOnly },
  );

  function setField(fieldId, value) {
    persist((s) => ({ ...s, responses: { ...s.responses, [fieldId]: value } }));
    markDirty();
  }

  const active = DAY2_SECTIONS.find((s) => s.id === activeId) ?? DAY2_SECTIONS[0];
  const totalMinutes = computePitchDuration(state);
  const overLimit = totalMinutes > (state.pitchMinutesLimit ?? 12);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-800">Build the Final Pitch</p>
        <PlaybookAutosaveStatus status={status} />
      </div>
      <p className="text-sm text-slate-600">
        Your final pitch is a business story — not a report. Present the strongest case for why the venture should exist and can succeed.
      </p>

      <nav className="flex flex-wrap gap-2" aria-label="Day 2 sections">
        {DAY2_SECTIONS.map((section, i) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveId(section.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              activeId === section.id ? 'bg-spike text-white' : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            {i + 1}. {section.title}
          </button>
        ))}
      </nav>

      <section className={CARD}>
        <h3 className="text-xl font-bold text-slate-900">{active.title}</h3>
        {active.prompt ? <p className="mt-2 text-sm text-slate-600">{active.prompt}</p> : null}
        {active.coaching ? <PlaybookCoachingList questions={active.coaching} className="mt-4" /> : null}

        {active.fields ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {active.fields.map((f) => (
              <PlaybookMissionField
                key={f.id}
                fieldId={f.id}
                label={f.label}
                value={state.responses[f.id] ?? ''}
                readOnly={readOnly}
                onChange={(v) => setField(f.id, v)}
              />
            ))}
          </div>
        ) : null}

        {active.kind === 'panel-audience' ? (
          <div className="mt-5 space-y-3">
            {['audienceConcern', 'audienceEvidence', 'audienceNumber', 'audienceProof', 'audienceQuestion', 'audienceResponse'].map((id) => (
              <PlaybookMissionField key={id} fieldId={id} label={id} value={state.responses[id] ?? ''} readOnly={readOnly} onChange={(v) => setField(id, v)} />
            ))}
          </div>
        ) : null}

        {active.kind === 'storyboard' ? (
          <div className="mt-5 space-y-3">
            {state.storyboard.filter((r) => !r.hidden).map((row, index) => (
              <div key={row.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <PlaybookMissionField fieldId={`${row.id}-msg`} label="Key message" value={row.keyMessage} readOnly={readOnly} onChange={(v) => persist((s) => { const storyboard = [...s.storyboard]; storyboard[index] = { ...row, keyMessage: v }; return { ...s, storyboard }; })} />
                  <PlaybookMissionField fieldId={`${row.id}-dur`} label="Duration (min)" value={row.durationMin} readOnly={readOnly} onChange={(v) => persist((s) => { const storyboard = [...s.storyboard]; storyboard[index] = { ...row, durationMin: v }; return { ...s, storyboard }; })} />
                  <PlaybookMissionField fieldId={`${row.id}-spk`} label="Speaker" value={row.speaker} readOnly={readOnly} onChange={(v) => persist((s) => { const storyboard = [...s.storyboard]; storyboard[index] = { ...row, speaker: v }; return { ...s, storyboard }; })} />
                  <PlaybookMissionField fieldId={`${row.id}-ev`} label="Evidence" value={row.evidence} readOnly={readOnly} onChange={(v) => persist((s) => { const storyboard = [...s.storyboard]; storyboard[index] = { ...row, evidence: v }; return { ...s, storyboard }; })} />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {active.kind === 'panel-bank' ? (
          <div className="mt-5 space-y-3">
            {state.panelBank.map((row, index) => (
              <div key={row.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-800">{row.question}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <PlaybookMissionField fieldId={`${row.id}-ans`} label="Answer" value={row.answer} readOnly={readOnly} onChange={(v) => persist((s) => { const panelBank = [...s.panelBank]; panelBank[index] = { ...row, answer: v }; return { ...s, panelBank }; })} />
                  <PlaybookMissionField fieldId={`${row.id}-ev`} label="Evidence" value={row.evidence} readOnly={readOnly} onChange={(v) => persist((s) => { const panelBank = [...s.panelBank]; panelBank[index] = { ...row, evidence: v }; return { ...s, panelBank }; })} />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {active.kind === 'speaker-plan' ? (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-slate-600">
              Total: {totalMinutes} min (limit {state.pitchMinutesLimit} min)
              {overLimit ? (
                <span className="ml-2 text-amber-800" role="note">Timing exceeds limit — review before pitch.</span>
              ) : null}
            </p>
            {(state.speakerPlan.length ? state.speakerPlan : [{ id: 'sp-1', section: '', speaker: '', durationMin: '', transition: '', visual: '', backupSpeaker: '', notes: '' }]).map((row, index) => (
              <div key={row.id} className="grid gap-2 sm:grid-cols-3">
                <PlaybookMissionField fieldId={`${row.id}-sec`} label="Section" value={row.section} readOnly={readOnly} onChange={(v) => persist((s) => { const speakerPlan = [...(s.speakerPlan.length ? s.speakerPlan : [row])]; speakerPlan[index] = { ...row, section: v }; return { ...s, speakerPlan }; })} />
                <PlaybookMissionField fieldId={`${row.id}-spk`} label="Speaker" value={row.speaker} readOnly={readOnly} onChange={(v) => persist((s) => { const speakerPlan = [...(s.speakerPlan.length ? s.speakerPlan : [row])]; speakerPlan[index] = { ...row, speaker: v }; return { ...s, speakerPlan }; })} />
                <PlaybookMissionField fieldId={`${row.id}-dur`} label="Duration" value={row.durationMin} readOnly={readOnly} onChange={(v) => persist((s) => { const speakerPlan = [...(s.speakerPlan.length ? s.speakerPlan : [row])]; speakerPlan[index] = { ...row, durationMin: v }; return { ...s, speakerPlan }; })} />
              </div>
            ))}
            {!readOnly ? (
              <button type="button" className="text-sm font-semibold text-spike hover:underline" onClick={() => persist((s) => ({ ...s, speakerPlan: [...s.speakerPlan, { id: `sp-${Date.now()}`, section: '', speaker: '', durationMin: '', transition: '', visual: '', backupSpeaker: '', notes: '' }] }))}>
                + Add run-sheet row
              </button>
            ) : null}
          </div>
        ) : null}

        {active.kind === 'slide-plan' ? (
          <div className="mt-5 space-y-3">
            {(state.slides.length ? state.slides : [{ id: 'sl-1', title: '', keyIdea: '', visual: '', keyNumber: '', speaker: '', source: '', status: 'not-started', notes: '' }]).map((row, index) => (
              <div key={row.id} className="rounded-xl border border-slate-200 p-3">
                <PlaybookMissionField fieldId={`${row.id}-title`} label="Slide title" value={row.title} readOnly={readOnly} onChange={(v) => persist((s) => { const slides = [...(s.slides.length ? s.slides : [row])]; slides[index] = { ...row, title: v }; return { ...s, slides }; })} />
                <PlaybookMissionField fieldId={`${row.id}-idea`} label="One key idea" value={row.keyIdea} readOnly={readOnly} onChange={(v) => persist((s) => { const slides = [...(s.slides.length ? s.slides : [row])]; slides[index] = { ...row, keyIdea: v }; return { ...s, slides }; })} />
              </div>
            ))}
            {!readOnly ? (
              <button type="button" className="text-sm font-semibold text-spike hover:underline" onClick={() => persist((s) => ({ ...s, slides: [...s.slides, { id: `sl-${Date.now()}`, title: '', keyIdea: '', visual: '', keyNumber: '', speaker: '', source: '', status: 'not-started', notes: '' }] }))}>
                + Add slide
              </button>
            ) : null}
          </div>
        ) : null}

        {active.kind === 'readiness' ? (
          <div className="mt-5 space-y-2">
            {state.readiness.map((item, index) => (
              <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="min-w-[200px] flex-1 text-sm text-slate-800">{item.label}</span>
                <select
                  className="rounded border border-slate-200 px-2 py-1 text-xs"
                  disabled={readOnly}
                  value={item.status}
                  onChange={(e) => persist((s) => {
                    const readiness = [...s.readiness];
                    readiness[index] = { ...item, status: e.target.value };
                    return { ...s, readiness };
                  })}
                >
                  <option value="not-reviewed">Not Yet Reviewed</option>
                  <option value="needs-work">Needs Work</option>
                  <option value="ready">Ready</option>
                </select>
              </div>
            ))}
          </div>
        ) : null}

        {active.kind === 'reflection' ? (
          <div className="mt-5 space-y-4">
            {(active.prompts ?? []).map((prompt, i) => (
              <PlaybookMissionField
                key={prompt}
                fieldId={`d2r-${i}`}
                label={prompt}
                value={state.reflection[`r${i}`] ?? ''}
                readOnly={readOnly}
                onChange={(v) => persist((s) => ({ ...s, reflection: { ...s.reflection, [`r${i}`]: v } }))}
              />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
