import { useCallback, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MAX_INTERVIEW_QUESTIONS, PREPARE_RULES } from '../../lib/customerDiscovery/week2Constants.js';
import { getWeek2State, saveInterviewQuestions } from '../../lib/customerDiscovery/week2DiscoveryService.js';
import { week2MissionHref } from '../../lib/customerDiscovery/week2MissionService.js';
import { isWeek2PortfolioSynced } from '../../lib/customerDiscovery/week2PortfolioSync.js';

/**
 * Interview guide builder — max 5 questions, autosave on blur.
 * @param {{ participantId: string, onSaved?: () => void, missionContext?: 'blueprint' | 'playbook' }} props
 */
export function InterviewGuideTask({ participantId, onSaved, missionContext = 'blueprint' }) {
  const initialState = getWeek2State(participantId);
  const initial = initialState.questions ?? [];
  const [questions, setQuestions] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [guideComplete, setGuideComplete] = useState(Boolean(initialState.guideCompletedAt));
  const [portfolioSynced, setPortfolioSynced] = useState(isWeek2PortfolioSynced(participantId));

  const filledCount = questions.filter((q) => String(q.text ?? '').trim().length > 8).length;
  const complete = guideComplete;

  const persist = useCallback(
    (next) => {
      setQuestions(next);
      const savedState = saveInterviewQuestions(participantId, next);
      setSaved(true);
      if (savedState.guideCompletedAt) {
        setGuideComplete(true);
        setPortfolioSynced(true);
        onSaved?.();
      }
    },
    [participantId, onSaved],
  );

  function updateQuestion(id, text) {
    persist(questions.map((q) => (q.id === id ? { ...q, text } : q)));
  }

  return (
    <div className="space-y-8">
      <section className="spike-surface space-y-2">
        <p className="spike-label">Interview guide</p>
        <h2 className="text-xl font-bold text-slate-900">Design {MAX_INTERVIEW_QUESTIONS} core questions</h2>
        <p className="text-sm text-slate-600">
          Quality over quantity — neutral, open-ended prompts only.
        </p>
        <p className="text-xs font-semibold tabular-nums text-spike">
          {filledCount} / {MAX_INTERVIEW_QUESTIONS} ready
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {PREPARE_RULES.examples.map((ex) => (
          <div key={ex.bad} className="rounded-xl bg-slate-50 p-3 text-xs">
            <p className="font-semibold text-red-700/80">✗ {ex.bad}</p>
            <p className="mt-1 font-medium text-venture-discover">✓ {ex.good}</p>
          </div>
        ))}
      </div>

      <ol className="space-y-4">
        {questions.slice(0, MAX_INTERVIEW_QUESTIONS).map((q, idx) => (
          <li key={q.id} className="spike-surface space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                {idx + 1}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {q.section ?? 'Question'}
              </span>
            </div>
            <input
              type="text"
              value={q.text}
              onChange={(e) => updateQuestion(q.id, e.target.value)}
              className="w-full border-0 bg-transparent text-sm font-medium text-slate-900 focus:outline-none focus:ring-0"
              placeholder={q.placeholder ?? 'Open-ended interview question…'}
            />
          </li>
        ))}
      </ol>

      {saved ? (
        <p className="inline-flex items-center gap-1 text-sm text-venture-discover">
          <Check size={14} /> Saved automatically
          {portfolioSynced ? ' · Portfolio updated' : ''}
        </p>
      ) : null}

      {complete ? (
        <div className="space-y-3 animate-spike-fade-in">
          <p className="text-sm font-semibold text-slate-800">Guide complete — portfolio synced.</p>
          <Link to={week2MissionHref('thinking', missionContext)} className="spike-btn-primary inline-flex">
            Capture thinking shift <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Complete all {MAX_INTERVIEW_QUESTIONS} questions to unlock portfolio sync.</p>
      )}
    </div>
  );
}
