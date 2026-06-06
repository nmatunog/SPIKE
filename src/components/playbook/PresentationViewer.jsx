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
 * }} props
 */
export function PresentationViewer({ presentation, slides }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slide = slides[currentIndex];

  if (!slide) {
    return <p className="text-sm text-gray-500">No slides in this presentation.</p>;
  }

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Presentation size={18} className="text-[#8B0000]" />
          <h4 className="font-bold text-gray-900">{presentation.title}</h4>
        </div>
      </div>

      <SlideNavigator
        currentIndex={currentIndex}
        total={slides.length}
        onPrevious={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        onNext={() => setCurrentIndex((i) => Math.min(slides.length - 1, i + 1))}
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SlideViewer slide={slide} />
        </div>
        <div className="space-y-3 lg:col-span-2">
          <SpeakerNotesPanel notes={slide.speakerNotes} />
          <DiscussionPanel questions={slide.discussionQuestions} />
        </div>
      </div>
    </section>
  );
}
