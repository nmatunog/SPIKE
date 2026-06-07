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
  const [showNotes, setShowNotes] = useState(false);
  const slide = slides[currentIndex];

  if (!slide) {
    return <p className="text-sm text-slate-500 lg:text-base">No slides in this presentation.</p>;
  }

  const notesPanel = (
    <div className="space-y-3">
      <SpeakerNotesPanel notes={slide.speakerNotes} />
      <DiscussionPanel questions={slide.discussionQuestions} />
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
        {!facultyMode ? (
          <button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            className="spike-btn-secondary !min-h-[40px] lg:hidden"
          >
            {showNotes ? 'Hide notes' : 'Show notes'}
          </button>
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
          <SlideViewer slide={slide} />
          {notesPanel}
        </div>
      ) : (
        <>
          <SlideViewer slide={slide} />
          <div className={`${showNotes ? 'block' : 'hidden'} lg:block`}>
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-1 2xl:max-w-projection">
              {notesPanel}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
