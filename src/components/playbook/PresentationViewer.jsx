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
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Presentation size={18} className="text-[#8B0000]" />
        <h4 className="font-bold text-gray-900">{presentation.title}</h4>
      </div>

      <SlideNavigator
        currentIndex={currentIndex}
        total={slides.length}
        onPrevious={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        onNext={() => setCurrentIndex((i) => Math.min(slides.length - 1, i + 1))}
      />

      <SlideViewer slide={slide} />
      <SpeakerNotesPanel notes={slide.speakerNotes} />
      <DiscussionPanel questions={slide.discussionQuestions} />
    </section>
  );
}
