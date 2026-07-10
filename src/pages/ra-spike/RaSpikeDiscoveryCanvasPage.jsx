import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import {
  getRaSpikeDiscoveryCanvas,
  getRaSpikeDiscoveryCanvasConfig,
  isDiscoveryCanvasComplete,
  listDiscoveryProblemOptions,
  saveRaSpikeDiscoveryCanvas,
} from '../../lib/raSpikeDiscoveryCanvas.js';
import { setRaSpikeStepStatus } from '../../lib/raSpikeWeekProgress.js';
import { ROUTES } from '../../routes/paths.js';

const WEEK = 2;
const INPUT =
  'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20';

/**
 * Week 2 — Customer Discovery Canvas (individual interview worksheet).
 * @param {{ user?: { id?: string } }} props
 */
export function RaSpikeDiscoveryCanvasPage({ user }) {
  const participantId = user?.id ?? '';
  const config = getRaSpikeDiscoveryCanvasConfig();
  const [canvas, setCanvas] = useState(() => getRaSpikeDiscoveryCanvas(participantId));
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!participantId) return;
    if (isDiscoveryCanvasComplete(participantId)) {
      setDone(true);
      void setRaSpikeStepStatus(participantId, WEEK, 'workshop', 'complete');
    }
  }, [participantId]);

  const problemOptions = useMemo(() => listDiscoveryProblemOptions(canvas), [canvas]);

  function update(patch) {
    const next = { ...canvas, ...patch };
    setCanvas(next);
    saveRaSpikeDiscoveryCanvas(participantId, next);
  }

  function updateProblem(index, value) {
    const problems = [...canvas.problems];
    problems[index] = value;
    update({ problems });
  }

  async function handleComplete() {
    if (!participantId || !isDiscoveryCanvasComplete(participantId)) return;
    saveRaSpikeDiscoveryCanvas(participantId, canvas);
    await setRaSpikeStepStatus(participantId, WEEK, 'workshop', 'complete');
    setDone(true);
  }

  const complete = isDiscoveryCanvasComplete(participantId);

  return (
    <RaSpikeShell user={user} showContextBar={false}>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-6">
          <Link
            to={ROUTES.raSpikePlaybook}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-spike"
          >
            <ArrowLeft size={16} /> Playbook
          </Link>

          <header>
            <h1 className="text-2xl font-bold text-slate-900">
              {config?.title ?? 'My Customer Discovery Canvas'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {config?.subtitle ?? 'Capture what you learned from real conversations.'}
            </p>
          </header>

          {done ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Discovery canvas saved. Continue to Assignment for your FEC guided start.
            </p>
          ) : null}

          <section className="spike-card space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Who did I interview?</h2>
            {config?.interviewExamples?.length ? (
              <p className="text-xs text-slate-500">
                Examples: {config.interviewExamples.join(' · ')}
              </p>
            ) : null}
            <textarea
              rows={3}
              className={INPUT}
              placeholder="Describe who you spoke with — segments, roles, or life situations."
              value={canvas.interviewed}
              onChange={(e) => update({ interviewed: e.target.value })}
            />
          </section>

          <section className="spike-card space-y-3">
            <h2 className="text-lg font-bold text-slate-900">What problems did they mention?</h2>
            <p className="text-sm text-slate-600">List the top five.</p>
            <ol className="space-y-2">
              {canvas.problems.map((problem, index) => (
                <li key={index} className="flex gap-2">
                  <span className="mt-2.5 w-5 shrink-0 text-sm font-bold text-slate-400">{index + 1}.</span>
                  <input
                    type="text"
                    className={INPUT}
                    placeholder={`Problem ${index + 1}`}
                    value={problem}
                    onChange={(e) => updateProblem(index, e.target.value)}
                  />
                </li>
              ))}
            </ol>
          </section>

          <section className="spike-card space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Which problem appeared most often?</h2>
            <p className="text-sm text-slate-600">Choose one.</p>
            {problemOptions.length ? (
              <div className="flex flex-wrap gap-2">
                {problemOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => update({ topProblem: option })}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                      canvas.topProblem === option
                        ? 'border-spike bg-spike text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-spike/40'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
            <input
              type="text"
              className={INPUT}
              placeholder="Or type the problem you heard most"
              value={canvas.topProblem}
              onChange={(e) => update({ topProblem: e.target.value })}
            />
          </section>

          <section className="spike-card space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Why is this problem important?</h2>
            <p className="text-sm text-slate-600">Write a short explanation.</p>
            <textarea
              rows={4}
              className={INPUT}
              value={canvas.whyImportant}
              onChange={(e) => update({ whyImportant: e.target.value })}
            />
          </section>

          <section className="spike-card space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Who experiences this most?</h2>
            <p className="text-sm text-slate-600">Describe the ideal customer.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Age</span>
                <input
                  type="text"
                  className={INPUT}
                  value={canvas.idealAge}
                  onChange={(e) => update({ idealAge: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Occupation</span>
                <input
                  type="text"
                  className={INPUT}
                  value={canvas.idealOccupation}
                  onChange={(e) => update({ idealOccupation: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Family</span>
                <input
                  type="text"
                  className={INPUT}
                  value={canvas.idealFamily}
                  onChange={(e) => update({ idealFamily: e.target.value })}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Income</span>
                <input
                  type="text"
                  className={INPUT}
                  value={canvas.idealIncome}
                  onChange={(e) => update({ idealIncome: e.target.value })}
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-slate-700">Life stage</span>
                <input
                  type="text"
                  className={INPUT}
                  value={canvas.idealLifeStage}
                  onChange={(e) => update({ idealLifeStage: e.target.value })}
                />
              </label>
            </div>
          </section>

          <section className="spike-card space-y-3">
            <h2 className="text-lg font-bold text-slate-900">What happens if nothing changes?</h2>
            <p className="text-sm text-slate-600">Describe the consequences.</p>
            <textarea
              rows={4}
              className={INPUT}
              value={canvas.ifNothingChanges}
              onChange={(e) => update({ ifNothingChanges: e.target.value })}
            />
          </section>

          <section className="spike-card space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Reflection</h2>
            <p className="text-sm text-slate-600">Finish the statement.</p>
            <label className="block text-sm">
              <span className="mb-2 block font-medium text-slate-800">
                The people I want to serve struggle with…
              </span>
              <textarea
                rows={3}
                className={INPUT}
                placeholder="Complete the sentence in your own words."
                value={canvas.reflectionStruggle}
                onChange={(e) => update({ reflectionStruggle: e.target.value })}
              />
            </label>
          </section>

          <button
            type="button"
            disabled={!complete && !done}
            onClick={() => void handleComplete()}
            className="spike-btn-primary min-h-[48px] w-full"
          >
            {done ? 'Workshop worksheet saved' : complete ? 'Save & complete workshop' : 'Complete all sections to finish'}
          </button>
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
