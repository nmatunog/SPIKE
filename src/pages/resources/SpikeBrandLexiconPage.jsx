import { Link } from 'react-router-dom';
import { ArrowLeft, BookMarked, Sparkles } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { ROUTES } from '../../routes/paths.js';
import {
  SPIKE_AI_DO,
  SPIKE_BRAND_LEXICON_META,
  SPIKE_BRAND_PRINCIPLES,
  SPIKE_CORE_MESSAGES,
  SPIKE_CULTURE_STATEMENTS,
  SPIKE_DECK_STYLES,
  SPIKE_DESIGN_AVOID,
  SPIKE_DESIGN_EVOKES,
  SPIKE_GUIDING_PRINCIPLES,
  SPIKE_IS,
  SPIKE_IS_NOT,
  SPIKE_JOURNEY_STEPS,
  SPIKE_ROLES,
  SPIKE_TERM_PAIRS,
  SPIKE_TONE,
  SPIKE_UNDER_REVIEW,
  SPIKE_VISION_QUOTES,
  SPIKE_WORDS_AVOID,
  SPIKE_WORDS_PREFER,
} from '../../lib/spikeBrandLexiconContent.js';

/** @param {{ backHref?: string, backLabel?: string }} [props] */
export function SpikeBrandLexiconPage({
  backHref = ROUTES.programCoachHome,
  backLabel = 'Back to dashboard',
}) {
  return (
    <PageContainer wide>
      <Link
        to={backHref}
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-spike"
      >
        <ArrowLeft size={16} /> {backLabel}
      </Link>

      <header className="relative overflow-hidden rounded-3xl border border-spike/15 bg-gradient-to-br from-slate-950 via-slate-900 to-spike-dark px-6 py-8 text-white sm:px-10 sm:py-10">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-spike/20 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-spike-light/90">
          {SPIKE_BRAND_LEXICON_META.subtitle}
        </p>
        <h1 className="mt-3 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
          <BookMarked size={32} className="text-spike-light" />
          {SPIKE_BRAND_LEXICON_META.title}
        </h1>
        <p className="mt-2 text-sm text-slate-300">Version {SPIKE_BRAND_LEXICON_META.version}</p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
          {SPIKE_BRAND_LEXICON_META.purpose}
        </p>
        <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-spike-light">
          {SPIKE_BRAND_LEXICON_META.status}
        </p>
      </header>

      <nav
        aria-label="Lexicon sections"
        className="sticky top-20 z-10 mt-6 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-card backdrop-blur"
      >
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Jump to</p>
        <div className="flex flex-wrap gap-2 text-sm">
          {[
            ['philosophy', 'Philosophy'],
            ['positioning', 'Positioning'],
            ['journey', 'Journey'],
            ['roles', 'Roles'],
            ['terminology', 'Terminology'],
            ['ai', 'AI Language'],
            ['culture', 'Culture'],
            ['vision', 'Vision'],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-lg bg-slate-50 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-spike-muted hover:text-spike"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="mt-8 space-y-10 pb-12">
        <LexiconSection id="philosophy" title="1. Philosophy">
          <p className="text-base leading-relaxed text-slate-700">
            SPIKE is not simply an internship. SPIKE is a venture-building practicum where university
            interns develop the mindset, competencies, and experience of real financial entrepreneurs
            through AI, mentorship, collaboration, and real business execution.
          </p>
          <p className="mt-4 text-sm text-slate-600">Language should reflect four principles:</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {SPIKE_BRAND_PRINCIPLES.map((item) => (
              <div key={item} className="rounded-xl bg-spike-muted/60 px-4 py-3 text-center text-sm font-semibold text-spike">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Avoid language that feels overly academic, corporate, or military while still maintaining
            credibility with universities and industry partners.
          </p>
        </LexiconSection>

        <LexiconSection id="positioning" title="2. Brand Positioning">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-900">What SPIKE is</h3>
              <ul className="mt-3 space-y-2 text-sm text-emerald-950">
                {SPIKE_IS.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm font-semibold text-emerald-900">
                SPIKE is a venture-building ecosystem.
              </p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-rose-900">What SPIKE is NOT</h3>
              <ul className="mt-3 space-y-2 text-sm text-rose-950">
                {SPIKE_IS_NOT.map((item) => (
                  <li key={item}>✕ {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </LexiconSection>

        <LexiconSection id="identity" title="3. Brand Identity">
          <blockquote className="rounded-2xl border-l-4 border-spike bg-gradient-to-r from-spike-muted/80 to-white px-6 py-5 text-xl font-semibold leading-snug text-slate-900 sm:text-2xl">
            Build your future by building a real venture.
          </blockquote>
          <p className="mt-3 text-sm text-slate-600">Every interaction should reinforce this message.</p>
        </LexiconSection>

        <LexiconSection id="journey" title="4. The SPIKE Journey">
          <div className="flex flex-wrap items-center gap-2">
            {SPIKE_JOURNEY_STEPS.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <span className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-card ring-1 ring-slate-200">
                  {step}
                </span>
                {index < SPIKE_JOURNEY_STEPS.length - 1 ? (
                  <span className="text-slate-300" aria-hidden>
                    →
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Future stages may evolve.</p>
        </LexiconSection>

        <LexiconSection id="roles" title="5. SPIKE Roles">
          <div className="grid gap-4 md:grid-cols-2">
            {SPIKE_ROLES.map((role) => (
              <article key={role.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{role.title}</h3>
                  {role.badge ? (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-2xs font-semibold uppercase text-indigo-800">
                      {role.badge}
                    </span>
                  ) : null}
                </div>
                {role.summary ? <p className="mt-2 text-sm text-slate-600">{role.summary}</p> : null}
                {role.meaning ? (
                  <p className="mt-2 text-sm text-slate-700">
                    <strong>Meaning:</strong> {role.meaning.join(' · ')}
                  </p>
                ) : null}
                {role.usedIn ? (
                  <p className="mt-2 text-sm text-slate-700">
                    <strong>Used in:</strong> {role.usedIn.join(' · ')}
                  </p>
                ) : null}
                {role.purpose ? (
                  <p className="mt-2 text-sm text-slate-700">
                    <strong>Purpose:</strong> {role.purpose.join(' · ')}
                  </p>
                ) : null}
                {role.responsibilities ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {role.responsibilities.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                {role.examples ? (
                  <p className="mt-2 text-sm text-slate-700">
                    <strong>Examples:</strong> {role.examples.join(' · ')}
                  </p>
                ) : null}
                {role.note ? <p className="mt-3 text-sm font-medium text-spike">{role.note}</p> : null}
                {role.neverUse ? (
                  <p className="mt-3 text-sm text-rose-800">
                    <strong>Never use:</strong> {role.neverUse.join(' · ')}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </LexiconSection>

        <LexiconSection id="terminology" title="6–13. Terminology & UI Language">
          <TermPairTable title="SPIKE Places" pairs={SPIKE_TERM_PAIRS.places} />
          <TermPairTable title="Learning Language" pairs={SPIKE_TERM_PAIRS.learning} className="mt-4" />
          <TermPairTable title="Daily Progress" pairs={SPIKE_TERM_PAIRS.dailyProgress} className="mt-4" />
          <TermPairTable title="Venture Language" pairs={SPIKE_TERM_PAIRS.venture} className="mt-4" />
          <TermPairTable title="UI Terminology" pairs={SPIKE_TERM_PAIRS.ui} className="mt-4" />
          <TermPairTable title="Presentation Language" pairs={SPIKE_TERM_PAIRS.presentation} className="mt-4" />
        </LexiconSection>

        <LexiconSection id="ai" title="10. AI Language">
          <p className="text-sm text-slate-700">Never describe AI as replacing thinking.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SPIKE_AI_DO.map((verb) => (
              <span key={verb} className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-900">
                {verb}
              </span>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              <strong>Never:</strong> AI writes your answers.
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <strong>Instead:</strong> AI helps you think better.
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-spike/20 bg-spike-muted/40 p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-spike">
              <Sparkles size={16} /> AI Venture Coach
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Your AI thinking partner that helps refine—not replace—your ideas.
            </p>
          </div>
        </LexiconSection>

        <LexiconSection id="messages" title="11. Core Messages">
          <ul className="grid gap-2 sm:grid-cols-2">
            {SPIKE_CORE_MESSAGES.map((message) => (
              <li key={message} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
                {message}
              </li>
            ))}
          </ul>
        </LexiconSection>

        <LexiconSection id="culture" title="14–17. Culture, Words & Tone">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Culture statements</h3>
          <ul className="mt-3 space-y-2">
            {SPIKE_CULTURE_STATEMENTS.map((item) => (
              <li key={item} className="text-sm text-slate-700">
                • {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <WordList title="Words we avoid" words={SPIKE_WORDS_AVOID} tone="avoid" />
            <WordList title="Words we prefer" words={SPIKE_WORDS_PREFER} tone="prefer" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Design should evoke</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {SPIKE_DESIGN_EVOKES.map((item) => (
                  <span key={item} className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Not</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {SPIKE_DESIGN_AVOID.map((item) => (
                  <span key={item} className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-900">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Tone of voice</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {SPIKE_TONE.use.map((item) => (
                <span key={item} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-900">
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-600">Never: {SPIKE_TONE.avoid.join(' · ')}</p>
          </div>
        </LexiconSection>

        <LexiconSection id="design" title="18–19. Design System & Guiding Principles">
          <div className="grid gap-4 md:grid-cols-2">
            {SPIKE_DECK_STYLES.map((deck) => (
              <article key={deck.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <h3 className="font-bold text-slate-900">{deck.title}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  <strong>Style:</strong> {deck.style.join(' · ')}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  <strong>Purpose:</strong> {deck.purpose}
                </p>
              </article>
            ))}
          </div>
          <ul className="mt-6 space-y-2">
            {SPIKE_GUIDING_PRINCIPLES.map((item) => (
              <li key={item} className="rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-800">
                {item}
              </li>
            ))}
          </ul>
        </LexiconSection>

        <LexiconSection id="review" title="20. Items Under Active Exploration">
          <ul className="space-y-2">
            {SPIKE_UNDER_REVIEW.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                {item}
              </li>
            ))}
          </ul>
        </LexiconSection>

        <LexiconSection id="vision" title="Vision for SPIKE">
          <p className="text-sm leading-relaxed text-slate-700">
            SPIKE should eventually become recognizable not only by its platform or curriculum, but by
            its language. Participants should naturally say things like:
          </p>
          <div className="mt-4 space-y-3">
            {SPIKE_VISION_QUOTES.map((quote) => (
              <blockquote
                key={quote}
                className="rounded-xl border-l-4 border-spike bg-white px-4 py-3 text-sm font-medium italic text-slate-800 shadow-card"
              >
                &ldquo;{quote}&rdquo;
              </blockquote>
            ))}
          </div>
        </LexiconSection>
      </div>
    </PageContainer>
  );
}

/** @param {{ id: string, title: string, children: import('react').ReactNode }} props */
function LexiconSection({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="border-b border-slate-200 pb-2 text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** @param {{ title: string, pairs: Array<{ avoid: string, prefer: string }>, className?: string }} props */
function TermPairTable({ title, pairs, className = '' }) {
  return (
    <div className={className}>
      <h3 className="mb-2 text-sm font-bold text-slate-800">{title}</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-2xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Instead of</th>
              <th className="px-4 py-2">Use</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair) => (
              <tr key={pair.avoid} className="border-t border-slate-100">
                <td className="px-4 py-2.5 text-rose-800 line-through decoration-rose-300">{pair.avoid}</td>
                <td className="px-4 py-2.5 font-medium text-emerald-900">{pair.prefer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** @param {{ title: string, words: string[], tone: 'avoid' | 'prefer' }} props */
function WordList({ title, words, tone }) {
  const chip =
    tone === 'avoid'
      ? 'bg-rose-50 text-rose-900 ring-rose-100'
      : 'bg-emerald-50 text-emerald-900 ring-emerald-100';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {words.map((word) => (
          <span key={word} className={`rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${chip}`}>
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
