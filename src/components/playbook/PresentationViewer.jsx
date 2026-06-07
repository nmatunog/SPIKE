import { useState } from 'react';
import { Presentation } from 'lucide-react';
import { SlideViewer } from './SlideViewer.jsx';
import { SpeakerNotesPanel } from './SpeakerNotesPanel.jsx';
import { DiscussionPanel } from './DiscussionPanel.jsx';
import { SlideNavigator } from './SlideNavigator.jsx';

/**
 * @param {{
 *   presentation: { title: string },
 *   slides: Array<{ title: string, body: string, speakerNotes: string, discussionQuestions: string[] }>,
 *   facultyMode?: boolean,
 * }} props
 */
export function PresentationViewer({ presentation, slides, facultyMode = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeSlide = slides[currentIndex];

  if (!activeSlide) {
    return <p className="text-sm text-slate-500 lg:text-base">No slides in this presentation.</p>;
  }

  const notesPanel = (
    <div className="space-y-3">
      <SpeakerNotesPanel notes={activeSlide.speakerNotes} />
      <DiscussionPanel questions={activeSlide.discussionQuestions} />
    </div>
  );

  return (
    <section className="spike-card space-y-4 lg:space-y-5 2xl:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Presentation size={20} className="shrink-0 text-spike lg:h-6 lg:w-6" aria-hidden />
          <h4 className="truncate font-semibold text-slate-900 lg:text-lg 2xl:text-xl">
            {presentation.title}
          </h4>
        </div>
        {facultyMode ? (
          <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-2xs font-semibold uppercase tracking-wide text-indigo-900">
            Facilitator view
          </span>
        ) : null}
      </div>

      <SlideNavigator
        currentIndex={currentIndex}
        total={slides.length}
        onPrevious={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        onNext={() => setCurrentIndex((i) => Math.min(slides.length - 1, i + 1))}
      />

      {facultyMode ? (
        <div className="grid gap-4 lg:grid-cols-2 2xl:gap-8">
          <SlideViewer slide={activeSlide} />
          {notesPanel}
        </div>
      ) : (
        <>
          <SlideViewer slide={activeSlide} />
          <p className="rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2.5 text-sm text-sky-950">
            Your facilitator leads live discussion in session. Complete the{' '}
            <strong>activities, worksheets, and survey</strong> below — they auto-fill your Venture
            Blueprint (Ambition & Purpose, Financial Canvas, Market Intelligence).
          </p>
        </>
      )}
    </section>
  );
}
