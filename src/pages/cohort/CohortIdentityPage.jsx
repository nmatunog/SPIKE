import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import {
  COHORT_MOTTO_EXAMPLES,
  COHORT_NAME_EXAMPLES,
  COHORT_THEME_EXAMPLES,
  hasSubmittedCohortIdentity,
  submitCohortIdentity,
} from '../../lib/cohortFormationService.js';
import { ROUTES } from '../../routes/paths.js';

const STEPS = ['welcome', 'name', 'motto', 'theme', 'submit'];

/**
 * @param {{ participantId: string }} props
 */
export function CohortIdentityPage({ participantId }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [motto, setMotto] = useState('');
  const [theme, setTheme] = useState('');
  const [done, setDone] = useState(() => hasSubmittedCohortIdentity(participantId));

  const stepId = STEPS[step];

  function handleSubmit() {
    submitCohortIdentity(participantId, {
      suggestedName: name,
      suggestedMotto: motto,
      suggestedTheme: theme,
    });
    setDone(true);
  }

  if (done) {
    return (
      <PageContainer>
        <section className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <Sparkles className="mx-auto mb-3 text-emerald-600" size={32} />
          <h2 className="text-xl font-bold text-emerald-950">Cohort identity submitted</h2>
          <p className="mt-2 text-sm text-emerald-800">
            Faculty will review suggestions and announce your official cohort identity. Next, rank
            your squad preferences.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to={ROUTES.squadPreferences} className="spike-btn-primary">
              Squad Preferences <ArrowRight size={16} />
            </Link>
            <Link to={ROUTES.ventureBlueprint} className="spike-btn-secondary">
              Back to Blueprint
            </Link>
          </div>
        </section>
      </PageContainer>
    );
  }

  return (
    <PageContainer wide>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex gap-2">
          {STEPS.map((s, idx) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${idx <= step ? 'bg-spike' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        {stepId === 'welcome' ? (
          <section className="rounded-2xl border border-spike/15 bg-gradient-to-br from-slate-900 to-spike-dark p-8 text-white shadow-projection">
            <p className="text-xs uppercase tracking-widest text-spike-light/80">Step 1 of 5</p>
            <h1 className="mt-3 text-3xl font-bold">Welcome to SPIKE</h1>
            <p className="mt-4 text-slate-300">
              Before we begin our journey, help shape the identity of this founding cohort. You are
              not enrolling in a class — you are joining a venture incubator.
            </p>
            <button type="button" onClick={() => setStep(1)} className="mt-8 spike-btn-primary bg-spike hover:bg-spike-light">
              Begin <ArrowRight size={16} />
            </button>
          </section>
        ) : null}

        {stepId === 'name' ? (
          <BuilderStep
            title="Cohort Name Builder"
            question="What should this cohort be remembered for?"
            value={name}
            onChange={setName}
            examples={COHORT_NAME_EXAMPLES}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
            canNext={name.trim().length >= 2}
          />
        ) : null}

        {stepId === 'motto' ? (
          <BuilderStep
            title="Cohort Motto Builder"
            question="What should define this cohort?"
            value={motto}
            onChange={setMotto}
            examples={COHORT_MOTTO_EXAMPLES}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            canNext={motto.trim().length >= 3}
          />
        ) : null}

        {stepId === 'theme' ? (
          <BuilderStep
            title="Theme Statement"
            question="What spirit should this cohort embody?"
            value={theme}
            onChange={setTheme}
            examples={COHORT_THEME_EXAMPLES}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
            canNext={theme.trim().length >= 3}
          />
        ) : null}

        {stepId === 'submit' ? (
          <section className="spike-card space-y-4">
            <h2 className="text-xl font-semibold text-slate-900">Review & submit</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="spike-label">Cohort name</dt>
                <dd className="font-semibold text-slate-900">{name}</dd>
              </div>
              <div>
                <dt className="spike-label">Motto</dt>
                <dd className="font-semibold text-slate-900">{motto}</dd>
              </div>
              <div>
                <dt className="spike-label">Theme spirit</dt>
                <dd className="font-semibold text-slate-900">{theme}</dd>
              </div>
            </dl>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(3)} className="spike-btn-secondary">
                Back
              </button>
              <button type="button" onClick={handleSubmit} className="spike-btn-primary">
                Submit cohort identity
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </PageContainer>
  );
}

function BuilderStep({ title, question, value, onChange, examples, onBack, onNext, canNext }) {
  return (
    <section className="spike-card space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="text-slate-600">{question}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
        placeholder="Your suggestion…"
      />
      <div className="flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => onChange(ex)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-spike hover:text-spike"
          >
            {ex}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onBack} className="spike-btn-secondary">
          Back
        </button>
        <button type="button" disabled={!canNext} onClick={onNext} className="spike-btn-primary disabled:opacity-50">
          Continue
        </button>
      </div>
    </section>
  );
}
