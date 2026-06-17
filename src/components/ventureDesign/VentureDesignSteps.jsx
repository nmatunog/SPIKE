import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  ChevronRight,
  Database,
  Download,
  Edit3,
  Fingerprint,
  Layout,
  Lightbulb,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Unlock,
  User,
} from 'lucide-react';
import { BRAND_PERSONALITY_TRAITS, VENTURE_DESIGN_KEYWORDS } from '../../lib/ventureDesignStudioConstants.js';
import { VentureDesignKeywordChips } from './VentureDesignKeywordChips.jsx';
import { FecCanvasLayout } from './FecCanvasLayout.jsx';

const inputClass =
  'w-full rounded-xl border-2 border-stone-200 bg-stone-50 p-4 font-medium text-stone-800 outline-none transition-all focus:border-spike focus:bg-white focus:ring-4 focus:ring-red-900/10';
const labelClass = 'mb-2 block text-xs font-bold uppercase tracking-widest text-stone-500';

/** @param {{ icon: import('react').ReactNode, title: string, subtitle: string }} props */
export function VentureDesignStepHeader({ icon, title, subtitle }) {
  return (
    <div className="mb-8 flex items-center justify-between rounded-2xl bg-stone-900 p-5 text-white shadow-md md:p-6">
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-xl border border-stone-700 bg-stone-800 p-3 text-yellow-500">{icon}</div>
        <div>
          <h3 className="text-xl font-black tracking-tight text-white md:text-2xl">{title}</h3>
          <p className="mt-1 text-sm font-medium text-stone-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   draft: import('../../lib/ventureDesignStudioService.js').VentureDesignIndividualDraft,
 *   researchSynced: boolean,
 *   readOnly: boolean,
 *   onChange: (patch: Partial<import('../../lib/ventureDesignStudioService.js').VentureDesignIndividualDraft>) => void,
 *   onAppend: (step: number, field: string, keyword: string) => void,
 * }} props
 */
export function VentureDesignStep1({ draft, researchSynced, readOnly, onChange, onAppend }) {
  return (
    <div>
      <VentureDesignStepHeader
        icon={<User size={24} />}
        title="Imported Customer Profile"
        subtitle="Loaded from Venture Research Studio — edit freely for your squad consolidation."
      />
      <div className="relative space-y-6 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 p-6 md:p-8">
        {researchSynced ? (
          <div className="absolute right-0 top-0 flex items-center gap-1 rounded-bl-xl bg-spike px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
            <Database size={12} /> Hydrated
          </div>
        ) : null}
        <div>
          <label className={labelClass}>Target Segment</label>
          <input
            type="text"
            disabled={readOnly}
            value={draft.step1.customer}
            onChange={(e) => onChange({ step1: { ...draft.step1, customer: e.target.value } })}
            className={inputClass}
          />
          <VentureDesignKeywordChips keywords={VENTURE_DESIGN_KEYWORDS[1]} disabled={readOnly} onSelect={(kw) => onAppend(1, 'customer', kw)} />
        </div>
        <div>
          <label className={labelClass}>Core Validated Problem</label>
          <textarea rows={3} disabled={readOnly} value={draft.step1.problem} onChange={(e) => onChange({ step1: { ...draft.step1, problem: e.target.value } })} className={`${inputClass} resize-y`} />
        </div>
        <div>
          <label className={labelClass}>Identified Opportunity</label>
          <textarea rows={3} disabled={readOnly} value={draft.step1.opportunity} onChange={(e) => onChange({ step1: { ...draft.step1, opportunity: e.target.value } })} className={`${inputClass} resize-y`} />
        </div>
      </div>
    </div>
  );
}

/** @param {Omit<Parameters<typeof VentureDesignStep1>[0], 'researchSynced'>} props */
export function VentureDesignStep2({ draft, readOnly, onChange, onAppend }) {
  return (
    <div>
      <VentureDesignStepHeader icon={<RefreshCw size={24} />} title="Customer Transformation" subtitle="What emotional shift does your venture provide?" />
      <div className="relative grid grid-cols-1 gap-6 rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-inner md:grid-cols-2 md:p-8">
        <div className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border border-stone-200 bg-white p-3 shadow-md md:flex">
          <ArrowRight className="text-stone-400" size={24} />
        </div>
        <div className="relative z-0 flex flex-col rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-800">
            <span className="h-2.5 w-2.5 rounded-full bg-stone-400" /> Before
          </label>
          <textarea rows={5} disabled={readOnly} value={draft.step2.beforeFeeling} onChange={(e) => onChange({ step2: { ...draft.step2, beforeFeeling: e.target.value } })} placeholder="Anxious, overwhelmed…" className="w-full resize-y rounded-xl border-2 border-stone-200 bg-stone-50 p-4 font-medium outline-none focus:border-stone-500 focus:bg-white" />
          <VentureDesignKeywordChips keywords={VENTURE_DESIGN_KEYWORDS[2].slice(0, 4)} disabled={readOnly} onSelect={(kw) => onAppend(2, 'beforeFeeling', kw)} />
        </div>
        <div className="relative z-0 mt-6 flex flex-col rounded-xl border border-stone-200 bg-white p-6 shadow-sm md:mt-0">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-spike">
            <span className="h-2.5 w-2.5 rounded-full bg-spike" /> After
          </label>
          <textarea rows={5} disabled={readOnly} value={draft.step2.afterFeeling} onChange={(e) => onChange({ step2: { ...draft.step2, afterFeeling: e.target.value } })} placeholder="Empowered, secure…" className="w-full resize-y rounded-xl border-2 border-red-100 bg-red-50/30 p-4 font-medium text-spike outline-none focus:border-spike focus:bg-white" />
          <VentureDesignKeywordChips keywords={VENTURE_DESIGN_KEYWORDS[2].slice(4)} disabled={readOnly} onSelect={(kw) => onAppend(2, 'afterFeeling', kw)} />
        </div>
      </div>
    </div>
  );
}

/** @param {Omit<Parameters<typeof VentureDesignStep1>[0], 'researchSynced'>} props */
export function VentureDesignStep3({ draft, readOnly, onChange, onAppend }) {
  const fields = [
    { key: 'whoServe', label: 'Who do you serve?', placeholder: 'Millennial creatives' },
    { key: 'transformation', label: 'What transformation?', placeholder: 'Build a safety net' },
    { key: 'whyUs', label: 'Why choose you?', placeholder: 'We speak their language' },
    { key: 'different', label: 'Mechanism?', placeholder: 'AIA Health portfolios' },
  ];
  return (
    <div>
      <VentureDesignStepHeader icon={<Lightbulb size={24} />} title="Unique Venture Proposition" subtitle="Squad members align here after individual drafts." />
      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key}>
            <label className={labelClass}>{field.label}</label>
            <input type="text" disabled={readOnly} value={draft.step3[field.key]} onChange={(e) => onChange({ step3: { ...draft.step3, [field.key]: e.target.value } })} placeholder={field.placeholder} className={inputClass} />
          </div>
        ))}
      </div>
      <VentureDesignKeywordChips keywords={VENTURE_DESIGN_KEYWORDS[3]} disabled={readOnly} onSelect={(kw) => onAppend(3, 'transformation', kw)} />
      <div className="relative mt-8 overflow-hidden rounded-2xl bg-spike p-8 shadow-xl md:p-10">
        <h4 className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-yellow-400"><Sparkles size={18} /> Drafted UVP</h4>
        <div className="text-2xl font-medium leading-relaxed text-white md:text-3xl">
          We help <input type="text" disabled={readOnly} value={draft.step3.synthesisA} onChange={(e) => onChange({ step3: { ...draft.step3, synthesisA: e.target.value } })} placeholder="[Target]" className="mx-2 w-48 border-b-2 border-red-800 bg-transparent text-center text-yellow-200 outline-none focus:border-yellow-400" /> achieve <input type="text" disabled={readOnly} value={draft.step3.synthesisB} onChange={(e) => onChange({ step3: { ...draft.step3, synthesisB: e.target.value } })} placeholder="[Transformation]" className="mx-2 w-64 border-b-2 border-red-800 bg-transparent text-center text-yellow-200 outline-none focus:border-yellow-400" /> through <input type="text" disabled={readOnly} value={draft.step3.synthesisC} onChange={(e) => onChange({ step3: { ...draft.step3, synthesisC: e.target.value } })} placeholder="[Mechanism]" className="mx-2 w-72 border-b-2 border-red-800 bg-transparent text-center text-yellow-200 outline-none focus:border-yellow-400" />.
        </div>
      </div>
    </div>
  );
}

/** @param {Omit<Parameters<typeof VentureDesignStep1>[0], 'researchSynced'> & {{ onTogglePersonality: (trait: string) => void }}} props */
export function VentureDesignStep4({ draft, readOnly, onChange, onAppend, onTogglePersonality }) {
  return (
    <div>
      <VentureDesignStepHeader icon={<Fingerprint size={24} />} title="Venture Identity" subtitle="How would your venture look and sound?" />
      <div className="space-y-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <label className={labelClass}>Venture Name</label>
            <input type="text" disabled={readOnly} value={draft.step4.name} onChange={(e) => onChange({ step4: { ...draft.step4, name: e.target.value } })} className={`${inputClass} text-xl font-bold text-spike`} />
          </div>
          <div>
            <label className={labelClass}>Tagline</label>
            <input type="text" disabled={readOnly} value={draft.step4.tagline} onChange={(e) => onChange({ step4: { ...draft.step4, tagline: e.target.value } })} className={inputClass} />
          </div>
        </div>
        <div className="border-t border-stone-100 pt-4">
          <label className={labelClass}>Brand Personality (2–3)</label>
          <div className="mt-4 flex flex-wrap gap-3">
            {BRAND_PERSONALITY_TRAITS.map((trait) => (
              <button key={trait} type="button" disabled={readOnly} onClick={() => onTogglePersonality(trait)} className={`rounded-full border-2 px-6 py-3 text-sm font-bold capitalize ${draft.step4.personality[trait] ? 'border-stone-900 bg-stone-900 text-yellow-500' : 'border-stone-200 bg-white text-stone-500'}`}>{trait}</button>
            ))}
          </div>
          <VentureDesignKeywordChips keywords={VENTURE_DESIGN_KEYWORDS[4]} disabled={readOnly} onSelect={(kw) => onAppend(4, 'clientFeeling', kw)} />
        </div>
        <div className="border-t border-stone-100 pt-4">
          <label className={labelClass}>Client Experience Goal</label>
          <textarea rows={3} disabled={readOnly} value={draft.step4.clientFeeling} onChange={(e) => onChange({ step4: { ...draft.step4, clientFeeling: e.target.value } })} className={`${inputClass} resize-y`} />
        </div>
      </div>
    </div>
  );
}

/** @param {{ draft: import('../../lib/ventureDesignStudioService.js').VentureDesignIndividualDraft }} props */
export function VentureDesignStep5({ draft }) {
  const uvp = `We help ${draft.step3.synthesisA || '…'} achieve ${draft.step3.synthesisB || '…'} through ${draft.step3.synthesisC || '…'}.`;

  return (
    <div>
      <VentureDesignStepHeader
        icon={<Layout size={24} />}
        title="Financial Entrepreneurship Canvas"
        subtitle="UVP is the heart — every box supports your proposition."
      />
      <div className="overflow-x-auto">
        <FecCanvasLayout
          mode="full"
          variant="embedded"
          showHeader
          showFooter
          centerContent={uvp}
          uvpDetailContent={uvp}
          boxContents={{
            who_we_serve: draft.step1.customer || undefined,
            problem_we_solve: draft.step1.problem || undefined,
            client_experience: draft.step4.clientFeeling || undefined,
            uvp_detail: uvp,
          }}
        />
      </div>
    </div>
  );
}

export function VentureDesignLanding({ squadName, researchSynced, onStart }) {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden rounded-3xl bg-stone-100 p-4 md:p-8">
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl">
        <div className="border-b-4 border-spike bg-stone-900 p-8 text-center md:p-12">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-yellow-500">Day 4 — Business Design</h2>
          <h1 className="mb-4 text-4xl font-black text-white md:text-6xl">Venture Design Studio</h1>
          <p className="mx-auto max-w-2xl text-lg text-stone-300">Turn market research into your Financial Entrepreneurship Canvas.</p>
        </div>
        <div className="p-8 md:p-12">
          <div className="mb-10 grid gap-10 md:grid-cols-2">
            <ul className="space-y-4">
              {['Customer Transformation', 'Unique Venture Proposition', 'Venture Brand Identity', 'FEC Preview'].map((item) => (
                <li key={item} className="flex gap-3 text-lg font-bold text-stone-800"><Unlock size={16} className="mt-1 shrink-0" />{item}</li>
              ))}
            </ul>
            <div className="rounded-3xl bg-spike p-8 text-white">
              <p className="text-lg">{researchSynced ? `Research for ${squadName || 'your squad'} is ready.` : 'Finish Research Studio for richer pre-fill.'}</p>
              <p className="mt-3 flex items-center gap-2 text-sm"><CheckCircle size={16} className="text-yellow-400" /> FEC &amp; Portfolio connected</p>
            </div>
          </div>
          <button type="button" onClick={onStart} className="w-full rounded-2xl bg-spike py-5 text-xl font-black text-white hover:bg-spike-light md:w-auto md:px-10">Initialize Venture Studio <ArrowRight className="inline ml-2" /></button>
        </div>
      </div>
    </div>
  );
}

export function VentureDesignCoachFeedback({ feedback, onRefine, onContinue }) {
  return (
    <div className="mt-6 rounded-2xl border border-stone-700 bg-stone-900 p-6 text-white md:p-8">
      <h4 className="font-bold text-white">SPIKE Venture Coach — {feedback.title}</h4>
      <p className="mt-4 border-l-4 border-yellow-500 pl-4 text-stone-200">&ldquo;{feedback.coach}&rdquo;</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onRefine} className="rounded-xl bg-stone-800 px-6 py-3 text-sm font-bold">Refine</button>
        <button type="button" onClick={onContinue} className="flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-6 py-3 text-sm font-bold text-stone-900">Continue <ChevronRight size={18} /></button>
      </div>
    </div>
  );
}

export function VentureDesignWorkshopHeader({ squadName, onSquadNameChange, readOnly }) {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-stone-800 bg-stone-900 px-4 py-3 md:px-6">
      <div>
        <h1 className="text-sm font-black uppercase tracking-widest text-white md:text-lg">Venture Design Studio</h1>
        <p className="text-[10px] font-bold uppercase text-stone-400"><Briefcase size={10} className="inline" /> Day 4</p>
      </div>
      <input type="text" disabled={readOnly} value={squadName} onChange={(e) => onSquadNameChange(e.target.value)} className="max-w-[140px] truncate bg-transparent text-right text-xs font-bold text-yellow-500 outline-none md:max-w-xs md:text-sm" />
    </div>
  );
}

export function VentureDesignFinalSummary({ draft, squadName, onJumpToStep, onDownload, onSave, isSaving, saveComplete }) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-t-3xl border-b-4 border-spike bg-stone-900 p-8 text-white md:p-12">
        <h2 className="text-4xl font-black md:text-5xl">{draft.step4.name || 'Venture Portfolio'}</h2>
        <p className="mt-2 text-xl text-stone-300">&ldquo;{draft.step4.tagline}&rdquo;</p>
        <p className="mt-4 text-sm text-stone-400">Squad: {squadName}</p>
      </div>
      <div className="rounded-b-3xl border border-stone-200 bg-white p-8 shadow-2xl">
        <div className="rounded-2xl bg-spike p-8 text-center text-white">
          <p className="text-2xl font-bold md:text-3xl">We help {draft.step3.synthesisA} achieve {draft.step3.synthesisB} through {draft.step3.synthesisC}.</p>
        </div>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button type="button" onClick={onDownload} className="flex items-center justify-center gap-2 rounded-xl border-2 border-stone-300 px-8 py-4 font-bold"><Download size={20} /> Download</button>
          <button type="button" onClick={onSave} disabled={isSaving || saveComplete} className="flex items-center justify-center gap-2 rounded-xl bg-spike px-10 py-4 font-bold text-white">
            {isSaving ? <Loader2 className="animate-spin" /> : saveComplete ? <CheckCircle /> : <Save />} {saveComplete ? 'Saved' : 'Save to FEC'}
          </button>
        </div>
        <button type="button" onClick={() => onJumpToStep(1)} className="mt-6 text-sm text-spike hover:underline"><Edit3 size={14} className="inline" /> Edit sections</button>
      </div>
    </div>
  );
}
