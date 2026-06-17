import {
  BarChart3,
  CircleDollarSign,
  Crown,
  DollarSign,
  Gem,
  Handshake,
  Heart,
  LayoutDashboard,
  Puzzle,
  Rocket,
  Route,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  User,
  UserCircle,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  FEC_DASHBOARD_BOX,
  FEC_FINANCIAL_ENGINE_BOX,
  FEC_GROWTH_ENGINES_BOX,
  FEC_LAYOUT_CENTER,
  FEC_LAYOUT_FOOTER,
  FEC_LAYOUT_SIMPLE_BOXES,
  FEC_LAYOUT_SUBTITLE,
  FEC_LAYOUT_TITLE,
  FEC_PROCESS_STEPS,
  FEC_ROADMAP_BOX,
} from '../../lib/fecCanvasLayout.js';
import { FEC_UVP_HELPER } from '../../lib/fecCanvasConstants.js';

/** @type {Record<string, import('lucide-react').LucideIcon>} */
const ICON_MAP = {
  Gem,
  Users,
  Target,
  Heart,
  Crown,
  TrendingUp,
  Handshake,
  CircleDollarSign,
  Route,
  LayoutDashboard,
  User,
  Rocket,
  BarChart3,
  Trophy,
  DollarSign,
  Shield,
  UserPlus,
  UserCircle,
  Sparkles,
  Puzzle,
};

/**
 * @param {{ name: string, size?: number, className?: string }} props
 */
function FecIcon({ name, size = 18, className = 'text-spike' }) {
  const Icon = ICON_MAP[name] ?? Target;
  return <Icon size={size} className={className} aria-hidden />;
}

/**
 * @param {{
 *   labels: string[],
 *   className?: string,
 * }} props
 */
function SuggestiveLabels({ labels, className = '' }) {
  return (
    <ul className={`space-y-0.5 text-xs leading-snug text-slate-600 ${className}`}>
      {labels.map((label) => (
        <li key={label} className="flex gap-1.5">
          <span className="text-spike">•</span>
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * @param {{
 *   mode: 'blank' | 'full',
 *   content?: string,
 *   minHeight?: string,
 * }} props
 */
function BoxBody({ mode, content, minHeight = '3.5rem' }) {
  if (mode === 'full' && content) {
    return <p className="mt-2 text-sm leading-relaxed text-slate-800">{content}</p>;
  }
  return (
    <div
      className="mt-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50"
      style={{ minHeight }}
    />
  );
}

/**
 * @param {{
 *   number: number,
 *   title: string,
 *   icon: string,
 *   prompt: string,
 *   labels: string[],
 *   output?: string,
 *   mode: 'blank' | 'full',
 *   content?: string,
 *   className?: string,
 * }} props
 */
function FecSimpleBox({
  number,
  title,
  icon,
  prompt,
  labels,
  output,
  mode,
  content,
  className = '',
}) {
  return (
    <article
      className={`flex h-full flex-col rounded-xl border-2 border-slate-200 bg-white p-3 shadow-sm md:p-4 ${className}`}
    >
      <div className="mb-2 flex items-start gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-spike text-[11px] font-black text-white">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <FecIcon name={icon} size={16} />
            <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-900 md:text-xs">
              {title}
            </h3>
          </div>
          <p className="mt-1 text-xs italic text-slate-500">{prompt}</p>
        </div>
      </div>
      <SuggestiveLabels labels={labels} />
      <div className="mt-auto pt-2">
        <BoxBody mode={mode} content={content} />
        {output ? <p className="mt-2 text-[10px] font-semibold text-spike">{output}</p> : null}
      </div>
    </article>
  );
}

/**
 * @param {{
 *   mode: 'blank' | 'full',
 *   centerContent?: string,
 *   uvpDetailContent?: string,
 *   boxContents?: Record<string, string>,
 *   complexContents?: Record<string, Record<string, string>>,
 *   showHeader?: boolean,
 *   showFooter?: boolean,
 *   variant?: 'poster' | 'embedded',
 * }} props
 */
export function FecCanvasLayout({
  mode,
  centerContent,
  uvpDetailContent,
  boxContents = {},
  complexContents = {},
  showHeader = true,
  showFooter = true,
  variant = 'poster',
}) {
  const boxesByGrid = {
    top: FEC_LAYOUT_SIMPLE_BOXES.filter((b) => b.grid === 'top'),
    left: FEC_LAYOUT_SIMPLE_BOXES.filter((b) => b.grid === 'left'),
    right: FEC_LAYOUT_SIMPLE_BOXES.filter((b) => b.grid === 'right'),
    centerDetail: FEC_LAYOUT_SIMPLE_BOXES.find((b) => b.grid === 'center-detail'),
  };

  const growthContent = complexContents.growth_engines ?? {};
  const financialContent = complexContents.financial_engine ?? {};
  const roadmapContent = complexContents.venture_roadmap ?? {};
  const dashboardContent = complexContents.measurement_dashboard ?? {};

  const shellClass =
    variant === 'poster'
      ? 'rounded-2xl border border-slate-300 bg-white text-slate-900 shadow-xl'
      : 'rounded-2xl border border-stone-200 bg-white text-slate-900';

  return (
    <div className={shellClass}>
      {showHeader ? (
        <header className="border-b border-slate-200 px-4 py-4 md:px-6 md:py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-spike px-2 py-0.5 text-[10px] font-black uppercase text-white">
                Week 1
              </span>
              <span className="rounded-full border-2 border-spike px-2 py-0.5 text-[10px] font-black uppercase text-spike">
                Day 4
              </span>
            </div>
            <div className="hidden items-center gap-2 text-right sm:flex">
              <Sparkles size={16} className="text-spike" aria-hidden />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                SPIKE Venture Studio
              </span>
            </div>
          </div>
          <h2 className="mt-3 text-xl font-black uppercase tracking-tight text-slate-900 md:text-3xl">
            {FEC_LAYOUT_TITLE.split(' ').map((word, i, arr) =>
              i === arr.length - 1 ? (
                <span key={word} className="text-spike">
                  {word}
                </span>
              ) : (
                <span key={word}>{word} </span>
              ),
            )}
          </h2>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 md:text-sm">
            {FEC_LAYOUT_SUBTITLE}
          </p>
          <div className="mt-4 flex flex-wrap justify-end gap-4 md:gap-6">
            {FEC_PROCESS_STEPS.map((step) => (
              <div key={step.label} className="flex items-center gap-2 text-[10px] font-semibold text-slate-600">
                <FecIcon name={step.icon} size={14} className="text-spike" />
                {step.label}
              </div>
            ))}
          </div>
        </header>
      ) : null}

      <div className="p-3 md:p-5">
        <div className="grid gap-3 lg:grid-cols-12 lg:grid-rows-[auto_auto_auto]">
          {/* Top row: WHO + PROBLEM */}
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-5 lg:col-start-1 lg:row-start-1">
            {boxesByGrid.top.map((box) => (
              <FecSimpleBox
                key={box.id}
                {...box}
                mode={mode}
                content={boxContents[box.id]}
              />
            ))}
          </div>

          {/* Right column: EXPERIENCE + STRATEGY */}
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:row-span-2">
            {boxesByGrid.right.map((box) => (
              <FecSimpleBox
                key={box.id}
                {...box}
                mode={mode}
                content={boxContents[box.id]}
              />
            ))}
          </div>

          {/* Center hub + box 1 detail */}
          <section className="flex flex-col lg:col-span-4 lg:col-start-5 lg:row-start-1 lg:row-span-2">
            <div className="flex flex-1 flex-col items-center justify-center rounded-full border-4 border-[#001F3F] bg-[#001F3F] px-6 py-8 text-center text-white shadow-lg lg:min-h-[240px]">
              <FecIcon name={FEC_LAYOUT_CENTER.icon} size={22} className="mb-2 text-spike" />
              <h3 className="text-sm font-black uppercase tracking-wide md:text-base">
                {FEC_LAYOUT_CENTER.title}
              </h3>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-200 md:text-sm">
                {FEC_LAYOUT_CENTER.tagline}
              </p>
              {mode === 'full' && centerContent ? (
                <p className="mt-4 max-w-sm text-sm font-semibold leading-relaxed text-yellow-100">
                  {centerContent}
                </p>
              ) : (
                <div className="mt-4 w-full max-w-xs min-h-[3rem] rounded-lg border-2 border-dashed border-white/30 bg-white/5" />
              )}
            </div>
            {boxesByGrid.centerDetail ? (
              <div className="mt-3">
                <FecSimpleBox
                  {...boxesByGrid.centerDetail}
                  mode={mode}
                  content={uvpDetailContent ?? boxContents[boxesByGrid.centerDetail.id]}
                />
                <p className="mt-2 text-center text-[10px] text-slate-400">{FEC_UVP_HELPER}</p>
              </div>
            ) : null}
          </section>

          {/* Left: KEY PARTNERS */}
          <div className="lg:col-span-3 lg:col-start-1 lg:row-start-2">
            {boxesByGrid.left.map((box) => (
              <FecSimpleBox
                key={box.id}
                {...box}
                mode={mode}
                content={boxContents[box.id]}
              />
            ))}
          </div>

          {/* Box 6 — GROWTH ENGINES */}
          <article className="rounded-xl border-2 border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:col-span-12 lg:row-start-3">
            <div className="mb-3 flex items-start gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-spike text-[11px] font-black text-white">
                {FEC_GROWTH_ENGINES_BOX.number}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <FecIcon name={FEC_GROWTH_ENGINES_BOX.icon} size={16} />
                  <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-900 md:text-xs">
                    {FEC_GROWTH_ENGINES_BOX.title}
                  </h3>
                </div>
                <p className="mt-1 text-xs italic text-slate-500">{FEC_GROWTH_ENGINES_BOX.prompt}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {FEC_GROWTH_ENGINES_BOX.columns.map((col) => (
                <div key={col.title} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <FecIcon name={col.icon} size={14} />
                    <p className="text-[10px] font-black uppercase text-slate-800">{col.title}</p>
                  </div>
                  <SuggestiveLabels labels={col.labels} />
                  <BoxBody mode={mode} content={growthContent[col.title]} minHeight="2.5rem" />
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] font-semibold text-spike">{FEC_GROWTH_ENGINES_BOX.output}</p>
          </article>

          {/* Box 8 — FINANCIAL ENGINE */}
          <article className="rounded-xl border-2 border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:col-span-12 lg:row-start-4">
            <div className="mb-3 flex items-start gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-spike text-[11px] font-black text-white">
                {FEC_FINANCIAL_ENGINE_BOX.number}
              </span>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-900 md:text-xs">
                  {FEC_FINANCIAL_ENGINE_BOX.title}
                </h3>
                <p className="mt-1 text-xs italic text-slate-500">{FEC_FINANCIAL_ENGINE_BOX.prompt}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {FEC_FINANCIAL_ENGINE_BOX.columns.map((col) => (
                <div key={col.title} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="mb-2 text-[10px] font-black uppercase text-[#001F3F]">{col.title}</p>
                  <SuggestiveLabels labels={col.labels} />
                  <BoxBody mode={mode} content={financialContent[col.title]} minHeight="2.5rem" />
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] font-semibold text-spike">{FEC_FINANCIAL_ENGINE_BOX.output}</p>
          </article>

          {/* Box 9 — ROADMAP */}
          <article className="overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-sm lg:col-span-12 lg:row-start-5">
            <div className="bg-[#001F3F] px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center bg-spike text-[10px] font-black text-white">
                  {FEC_ROADMAP_BOX.number}
                </span>
                <h3 className="text-xs font-black uppercase tracking-wide text-white">
                  {FEC_ROADMAP_BOX.title}
                </h3>
              </div>
              <p className="text-[10px] text-slate-300">{FEC_ROADMAP_BOX.subtitle}</p>
            </div>
            <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-4 md:p-4">
              {FEC_ROADMAP_BOX.stages.map((stage) => (
                <div key={stage.title} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <FecIcon name={stage.icon} size={14} />
                    <p className="text-[10px] font-black uppercase leading-tight text-slate-800">
                      {stage.title}
                    </p>
                  </div>
                  <SuggestiveLabels labels={stage.labels} />
                  <BoxBody mode={mode} content={roadmapContent[stage.title]} minHeight="2.5rem" />
                </div>
              ))}
            </div>
            <p className="border-t border-slate-100 px-4 py-2 text-[10px] font-medium text-slate-500">
              {FEC_ROADMAP_BOX.footer}
            </p>
          </article>

          {/* Box 10 — DASHBOARD */}
          <article className="overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-sm lg:col-span-12 lg:row-start-6">
            <div className="bg-[#001F3F] px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center bg-spike text-[10px] font-black text-white">
                  {FEC_DASHBOARD_BOX.number}
                </span>
                <h3 className="text-xs font-black uppercase tracking-wide text-white">
                  {FEC_DASHBOARD_BOX.title}
                </h3>
              </div>
              <p className="text-[10px] text-slate-300">{FEC_DASHBOARD_BOX.subtitle}</p>
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 md:p-4">
              {FEC_DASHBOARD_BOX.columns.map((col) => (
                <div key={col.title} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <FecIcon name={col.icon} size={13} />
                    <p className="text-[9px] font-black uppercase text-slate-800">{col.title}</p>
                  </div>
                  <SuggestiveLabels labels={col.labels} className="text-[10px]" />
                  <BoxBody mode={mode} content={dashboardContent[col.title]} minHeight="2rem" />
                </div>
              ))}
            </div>
            <p className="border-t border-slate-100 px-4 py-2 text-[10px] font-medium text-slate-500">
              {FEC_DASHBOARD_BOX.footer}
            </p>
          </article>
        </div>
      </div>

      {showFooter ? (
        <footer className="flex items-center justify-between gap-3 bg-[#001F3F] px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-white md:px-6 md:text-xs">
          <Target size={16} className="shrink-0 text-spike" aria-hidden />
          <p className="text-center leading-snug">{FEC_LAYOUT_FOOTER}</p>
          <Sparkles size={16} className="shrink-0 text-amber-400" aria-hidden />
        </footer>
      ) : null}
    </div>
  );
}
