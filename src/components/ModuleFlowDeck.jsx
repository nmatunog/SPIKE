import React, { useState } from 'react';
import { Target } from 'lucide-react';

const genZPalette = [
  {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-900',
    hover: 'hover:bg-rose-100',
    activeBg: 'bg-rose-500',
    activeText: 'text-white',
    ring: 'ring-rose-500/30',
  },
  {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-900',
    hover: 'hover:bg-indigo-100',
    activeBg: 'bg-indigo-500',
    activeText: 'text-white',
    ring: 'ring-indigo-500/30',
  },
  {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-900',
    hover: 'hover:bg-teal-100',
    activeBg: 'bg-teal-500',
    activeText: 'text-white',
    ring: 'ring-teal-500/30',
  },
  {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    hover: 'hover:bg-amber-100',
    activeBg: 'bg-amber-500',
    activeText: 'text-white',
    ring: 'ring-amber-500/30',
  },
  {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-900',
    hover: 'hover:bg-violet-100',
    activeBg: 'bg-violet-500',
    activeText: 'text-white',
    ring: 'ring-violet-500/30',
  },
  {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    hover: 'hover:bg-emerald-100',
    activeBg: 'bg-emerald-500',
    activeText: 'text-white',
    ring: 'ring-emerald-500/30',
  },
  {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-900',
    hover: 'hover:bg-sky-100',
    activeBg: 'bg-sky-500',
    activeText: 'text-white',
    ring: 'ring-sky-500/30',
  },
];

export function ModuleFlowDeck({ items }) {
  const [activeIdx, setActiveIdx] = useState(null);

  return (
    <div className="mt-4 w-full">
      <div className="mb-6 flex flex-wrap gap-3">
        {items.map((item, idx) => {
          const parts = item.title.split(':');
          const modNum = parts[0];
          const modName = parts[1] ? parts[1].trim() : parts[0];
          const theme = genZPalette[idx % genZPalette.length];

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
              className={`relative flex min-h-[120px] grow basis-[120px] flex-col items-center justify-center overflow-hidden rounded-xl border-2 p-4 text-center font-bold shadow-sm transition-all duration-300 md:basis-[150px] ${
                activeIdx === idx
                  ? `${theme.activeBg} ${theme.activeText} ${theme.ring} z-10 scale-105 border-transparent shadow-lg ring-4`
                  : `${theme.bg} ${theme.text} ${theme.border} ${theme.hover} hover:z-10 hover:scale-105 hover:shadow-md`
              }`}
            >
              <span
                className={`mb-2 text-xs uppercase tracking-wider ${
                  activeIdx === idx ? 'text-white/80' : 'opacity-60'
                }`}
              >
                {modNum}
              </span>
              <span className="relative z-10 text-sm leading-snug md:text-base">
                {modName}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className={`overflow-hidden rounded-2xl transition-all duration-300 ease-in-out ${
          activeIdx !== null
            ? `max-h-[500px] border-2 opacity-100 shadow-inner ${genZPalette[activeIdx % genZPalette.length].bg} ${genZPalette[activeIdx % genZPalette.length].border}`
            : 'max-h-0 border-0 opacity-0'
        }`}
      >
        {activeIdx !== null && (() => {
          const theme = genZPalette[activeIdx % genZPalette.length];
          return (
            <div className="animate-in slide-in-from-top-4 fade-in p-6 duration-300 md:p-8">
              <div className="flex items-start gap-4">
                <div
                  className={`shrink-0 rounded-full p-3 shadow-sm ${theme.activeBg} ${theme.activeText}`}
                >
                  <Target size={24} />
                </div>
                <div>
                  <h5 className={`mb-3 text-xl font-extrabold ${theme.text}`}>
                    {items[activeIdx].title}
                  </h5>
                  <p className="text-base font-medium leading-relaxed text-gray-800">
                    {items[activeIdx].desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
