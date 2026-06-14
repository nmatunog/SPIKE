import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DAY1_BUILDERS, isCoachBackedBuilder } from '../../lib/day1BuilderConstants.js';
import {
  completeDay1Builder,
  getBuilderData,
  getDay1MissionProgress,
  isBuilderCompleted,
  isBuilderEditLocked,
  canRefineBuilder,
  startBuilderRefinement,
  readBuilderEntry,
  resetDay1Builder,
  saveBuilderDraft,
} from '../../lib/day1BuilderService.js';
import { Day1MissionControl } from './Day1MissionControl.jsx';
import { Day1CoachSection } from './Day1CoachSection.jsx';
import { BuilderResetButton } from './BuilderResetButton.jsx';
import { DreamBoardStudio } from './builders/DreamBoardStudio.jsx';
import { SquadFormationBuilder } from './builders/SquadFormationBuilder.jsx';
import { SquadCharterBuilder } from './builders/SquadCharterBuilder.jsx';
import { ROUTES } from '../../routes/paths.js';

const CLASSIC_BUILDERS = {
  'dream-board': DreamBoardStudio,
  'squad-formation': SquadFormationBuilder,
  'squad-charter': SquadCharterBuilder,
};

/**
 * @param {{
 *   participantId: string,
 *   participantName: string,
 *   squadName?: string,
 *   initialBuilder?: string,
 * }} props
 */
export function Day1BuildersShell({
  participantId,
  participantName,
  squadName,
  initialBuilder,
}) {
  const firstIncompleteId = getDay1MissionProgress(participantId).builders.find((b) => !b.completed)?.id
    ?? 'ambition-builder';
  const [activeId, setActiveId] = useState(initialBuilder ?? firstIncompleteId);
  const [draft, setDraft] = useState(() => getBuilderData(participantId, activeId) ?? {});
  const [refreshKey, setRefreshKey] = useState(0);
  const [builderMountKey, setBuilderMountKey] = useState(0);

  const activeBuilder = DAY1_BUILDERS.find((b) => b.id === activeId) ?? DAY1_BUILDERS[0];
  const activeIndex = DAY1_BUILDERS.findIndex((b) => b.id === activeId);
  const builderEntry = readBuilderEntry(participantId, activeId);
  const editLocked = isBuilderEditLocked(participantId, activeId);
  const refining = Boolean(builderEntry?.refining);
  const submitted = isBuilderCompleted(participantId, activeId);
  const showSubmitted = submitted && !refining;
  const ClassicComponent = CLASSIC_BUILDERS[activeId];
  const isCoach = isCoachBackedBuilder(activeId);
  const coachConversationIndex = DAY1_BUILDERS.filter((b) => b.coachSection).findIndex((b) => b.id === activeId) + 1;
  const coachConversationTotal = DAY1_BUILDERS.filter((b) => b.coachSection).length;

  function switchBuilder(id) {
    setActiveId(id);
    setDraft(getBuilderData(participantId, id) ?? {});
  }

  function handleDraftChange(next) {
    setDraft(next);
    saveBuilderDraft(participantId, activeId, next);
  }

  function handleClassicComplete(next) {
    completeDay1Builder(participantId, activeId, next);
    advanceToNext();
  }

  function advanceToNext() {
    setRefreshKey((k) => k + 1);
    const nextBuilder = DAY1_BUILDERS[activeIndex + 1];
    if (nextBuilder) switchBuilder(nextBuilder.id);
  }

  function handleStartRefine() {
    startBuilderRefinement(participantId, activeId);
    setRefreshKey((k) => k + 1);
    setBuilderMountKey((k) => k + 1);
  }

  function handleReset() {
    resetDay1Builder(participantId, activeId);
    setDraft({});
    setBuilderMountKey((k) => k + 1);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-6">
      <Day1MissionControl participantId={participantId} key={refreshKey} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="spike-card space-y-1 p-3">
          <p className="mb-2 px-2 spike-label">AI Venture Coach™ · Day 1</p>
          {DAY1_BUILDERS.map((builder, idx) => {
            const done = isBuilderCompleted(participantId, builder.id);
            const active = builder.id === activeId;
            const coachItem = Boolean(builder.coachSection);
            return (
              <button
                key={builder.id}
                type="button"
                onClick={() => switchBuilder(builder.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  active
                    ? 'bg-spike text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    active ? 'bg-white/20' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'
                  }`}
                >
                  {done ? <Check size={14} /> : coachItem ? <Sparkles size={12} /> : idx + 1}
                </span>
                <span className="font-medium">{builder.label}</span>
              </button>
            );
          })}
          <Link
            to={`${ROUTES.ventureBlueprint}/coach`}
            className="mt-2 flex items-center gap-2 px-3 py-2 text-sm font-medium text-spike hover:underline"
          >
            <Sparkles size={14} /> Full coach experience
          </Link>
          <Link
            to={ROUTES.ventureBlueprint}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-spike"
          >
            <ArrowLeft size={16} /> Back to Blueprint
          </Link>
        </nav>

        <div className="min-w-0">
          <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {isCoach ? (
                <>
                  <p className="spike-label text-spike">
                    AI Venture Coach™ · Conversation {coachConversationIndex} of {coachConversationTotal}
                  </p>
                  <h3 className="text-xl font-semibold text-slate-900 lg:text-2xl">{activeBuilder.label}</h3>
                </>
              ) : (
                <>
                  <p className="spike-label text-spike">
                    Builder {activeIndex + 1} of {DAY1_BUILDERS.length}
                  </p>
                  <h3 className="text-xl font-semibold text-slate-900 lg:text-2xl">{activeBuilder.label}</h3>
                </>
              )}
              <p className="mt-1 text-sm text-slate-600">{activeBuilder.description}</p>
              <p className="mt-1 text-xs text-slate-500">Feeds → {activeBuilder.feeds}</p>
            </div>
            <BuilderResetButton
              onReset={handleReset}
              disabled={editLocked}
              label={isCoach ? 'Start conversation over' : 'Reset all fields'}
            />
          </header>

          {isCoach ? (
            <Day1CoachSection
              key={`${activeId}-${builderMountKey}`}
              builderId={activeId}
              participantId={participantId}
              onProgress={() => setRefreshKey((k) => k + 1)}
              onSectionComplete={advanceToNext}
            />
          ) : ClassicComponent ? (
            <ClassicComponent
              key={`${activeId}-${builderMountKey}`}
              participantId={participantId}
              participantName={participantName}
              squadName={squadName}
              draft={draft}
              completed={showSubmitted}
              editLocked={editLocked}
              refining={refining}
              completedAt={builderEntry?.completedAt}
              firstCompletedAt={builderEntry?.firstCompletedAt}
              canRefine={canRefineBuilder(participantId, activeId)}
              onStartRefine={handleStartRefine}
              onChange={handleDraftChange}
              onComplete={handleClassicComplete}
            />
          ) : null}

          <div className="mt-6 flex justify-between gap-3">
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => switchBuilder(DAY1_BUILDERS[activeIndex - 1].id)}
              className="spike-btn-secondary disabled:opacity-40"
            >
              <ArrowLeft size={16} /> Previous
            </button>
            <button
              type="button"
              disabled={activeIndex >= DAY1_BUILDERS.length - 1}
              onClick={() => switchBuilder(DAY1_BUILDERS[activeIndex + 1].id)}
              className="spike-btn-secondary disabled:opacity-40"
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
