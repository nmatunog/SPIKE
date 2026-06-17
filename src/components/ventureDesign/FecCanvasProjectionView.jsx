import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Monitor } from 'lucide-react';
import { FEC_TOP_BANNER } from '../../lib/fecCanvasConstants.js';
import {
  FEC_CANVAS_EXEMPLAR_ENGINES,
  FEC_CANVAS_EXEMPLAR_SUMMARY,
} from '../../lib/fecCanvasExemplar.js';
import { BLUEPRINT_LINKS } from '../../routes/paths.js';
import { PROGRAM_COACH_LABEL } from '../../lib/terminology.js';
import {
  FecCanvasLayout,
} from './FecCanvasLayout.jsx';
import { buildFecLayoutExemplarContent } from '../../lib/fecCanvasLayoutContent.js';

/**
 * FEC overview projection — blank/full toggle for Program Coach and mentors only.
 * @param {{
 *   canToggleMode?: boolean,
 *   exitHref?: string,
 *   viewerRole?: string,
 * }} props
 */
export function FecCanvasProjectionView({
  canToggleMode = false,
  exitHref = BLUEPRINT_LINKS.businessPlan,
  viewerRole = 'intern',
}) {
  const [mode, setMode] = useState(/** @type {'blank' | 'full'} */ ('blank'));
  const displayMode = canToggleMode ? mode : 'blank';
  const isFaculty = viewerRole === 'faculty';
  const projectionLabel = isFaculty
    ? `${PROGRAM_COACH_LABEL} projection`
    : viewerRole === 'mentor'
      ? 'Mentor projection'
      : 'FEC overview';

  const exemplar =
    displayMode === 'full'
      ? buildFecLayoutExemplarContent({
          summary: FEC_CANVAS_EXEMPLAR_SUMMARY,
          engines: FEC_CANVAS_EXEMPLAR_ENGINES,
        })
      : null;

  return (
    <div className="-mx-4 min-h-screen bg-stone-950 font-sans text-white md:-mx-0">
      <header className="sticky top-0 z-50 border-b border-stone-800 bg-stone-950/95 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Monitor size={20} className="shrink-0 text-amber-400" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">
                {projectionLabel}
              </p>
              <h1 className="truncate text-sm font-bold md:text-base">Financial Entrepreneurship Canvas</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canToggleMode ? (
              <div
                className="inline-flex rounded-xl border border-stone-700 bg-stone-900 p-1"
                role="group"
                aria-label="Canvas display mode"
              >
                <button
                  type="button"
                  onClick={() => setMode('blank')}
                  className={`min-h-[40px] rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                    displayMode === 'blank' ? 'bg-white text-stone-900' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Blank canvas
                </button>
                <button
                  type="button"
                  onClick={() => setMode('full')}
                  className={`min-h-[40px] rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
                    displayMode === 'full' ? 'bg-amber-400 text-stone-900' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Full canvas
                </button>
              </div>
            ) : null}
            {canToggleMode ? (
              <Link
                to={`${BLUEPRINT_LINKS.businessPlan}?start=1`}
                className="hidden min-h-[40px] items-center rounded-xl border border-stone-600 px-4 py-2 text-xs font-semibold text-stone-200 hover:bg-stone-800 sm:inline-flex"
              >
                Open workshop
              </Link>
            ) : null}
            <Link
              to={exitHref}
              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-stone-600 px-3 py-2 text-xs font-semibold text-stone-300 hover:bg-stone-800"
            >
              <ArrowLeft size={14} aria-hidden />
              Exit
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[100rem] px-4 py-6 md:px-8 md:py-10">
        <p className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-center text-sm font-medium text-amber-100 md:text-base">
          {FEC_TOP_BANNER}
        </p>

        <FecCanvasLayout
          mode={displayMode}
          variant="poster"
          centerContent={exemplar?.centerContent}
          uvpDetailContent={exemplar?.uvpDetailContent}
          boxContents={exemplar?.boxContents}
          complexContents={exemplar?.complexContents}
        />
      </div>
    </div>
  );
}
