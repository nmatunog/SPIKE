import { useState } from 'react';
import { BookOpen, PlayCircle } from 'lucide-react';

/**
 * Wraps legacy orientation + syllabus views under the Playbook module label.
 * Curriculum engine scaffolding — content still from static modules until Phase 3.
 */
export function PlaybookShell({ orientationView, syllabusView }) {
  const [tab, setTab] = useState('orientation');

  return (
    <div>
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="container mx-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('orientation')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${
              tab === 'orientation'
                ? 'bg-[#8B0000] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PlayCircle size={16} /> Orientation
          </button>
          <button
            type="button"
            onClick={() => setTab('syllabus')}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${
              tab === 'syllabus'
                ? 'bg-[#8B0000] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BookOpen size={16} /> Master Blueprint
          </button>
        </div>
      </div>
      {tab === 'orientation' ? orientationView : syllabusView}
    </div>
  );
}
