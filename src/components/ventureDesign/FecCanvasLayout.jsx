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

function FecUvpCenter({ mode, centerContent, uvpDetailContent, scoreMeta, animateScore = true, focused = false }) {
  const content = centerContent ?? uvpDetailContent;
  const validated = scoreMeta && scoreMeta.after > scoreMeta.before;
  return (
    <section className={`relative flex h-full flex-col rounded-xl border-2 bg-spike p-4 text-center text-white shadow-lg transition-all duration-700 md:p-5 ${focused ? 'ring-4 ring-emerald-300/60' : 'border-spike'}`}>
      {scoreMeta ? (
        <div className="absolute right-2 top-2 rounded-lg bg-black/40 px-2 py-1 text-[10px] font-bold">
          {animateScore && validated ? (
            <span>
              <span className="text-red-200/70 line-through">{scoreMeta.before}%</span>{' '}
              <span className="text-yellow-200">→ {scoreMeta.after}%</span>
            </span>
          ) : (
            <span className="text-yellow-200">{scoreMeta.after}%</span>
          )}
        </div>
      ) : null}
      <Heart size={22} className="mx-auto mb-2 text-white" aria-hidden />
      <h3 className="text-xs font-black uppercase tracking-wide md:text-sm">{FEC_LAYOUT_CENTER.title}</h3>
      <p className="mt-1 text-[11px] text-red-100">{FEC_LAYOUT_CENTER.tagline}</p>
      <p className="mt-3 text-[10px] italic text-red-200/90">{FEC_LAYOUT_CENTER.prompt}</p>
      <SuggestiveLabels
        labels={FEC_LAYOUT_CENTER.labels}
        className="mt-2 text-left text-[10px] text-red-100 [&_li>span:first-child]:text-yellow-300 [&_li>span:last-child]:text-red-100"
      />
      <div className="mt-auto pt-3">
        {mode === 'full' && content ? (
          <p className="rounded-lg bg-black/20 px-3 py-2 text-sm font-semibold leading-relaxed text-yellow-100">
            {content}
          </p>
        ) : (
          <div className="min-h-[4rem] rounded-lg border-2 border-dashed border-white/40 bg-white/10" />
        )}
        <p className="mt-2 text-[10px] font-semibold text-yellow-300">{FEC_LAYOUT_CENTER.output}</p>
        <p className="mt-2 text-[10px] text-red-200/80">{FEC_UVP_HELPER}</p>
      </div>
    </section>
  );
}

/**
 * @param {{
 *   box: typeof FEC_GROWTH_ENGINES_BOX | typeof FEC_FINANCIAL_ENGINE_BOX,
 *   mode: 'blank' | 'full',
 *   columnContent: Record<string, string>,
 *   compact?: boolean,
 * }} props
 */
function FecSideComplexBox({ box, mode, columnContent, compact = false }) {
  return (
    <article className="flex h-full flex-col rounded-xl border-2 border-slate-200 bg-white p-3 shadow-sm md:p-4">
      <div className="mb-2 flex items-start gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-spike text-[11px] font-black text-white">
          {box.number}
        </span>
        <div className="min-w-0">
          {'icon' in box && box.icon ? (
            <div className="flex items-center gap-2">
              <FecIcon name={box.icon} size={16} />
              <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-900">{box.title}</h3>
            </div>
          ) : (
            <h3 className="text-[10px] font-black uppercase tracking-wide text-slate-900">{box.title}</h3>
          )}
          <p className="mt-1 text-[10px] italic text-slate-500">{box.prompt}</p>
        </div>
      </div>
      <div className={`grid flex-1 gap-2 ${compact ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
        {box.columns.map((col) => (
          <div key={col.title} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
            <p className="mb-1 text-[9px] font-black uppercase text-[#001F3F]">{col.title}</p>
            <SuggestiveLabels labels={col.labels} className="text-[10px]" />
            <BoxBody mode={mode} content={columnContent[col.title]} minHeight="2rem" />
          </div>
        ))}
      </div>
      {box.output ? <p className="mt-2 text-[10px] font-semibold text-spike">{box.output}</p> : null}
    </article>
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
 *   scoreMeta?: { before: number, after: number, status?: string, evidenceCount?: number },
 *   animateScore?: boolean,
 *   dimmed?: boolean,
 *   focused?: boolean,
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
  scoreMeta,
  animateScore = true,
  dimmed = false,
  focused = false,
}) {
  const validated = scoreMeta && scoreMeta.after > scoreMeta.before;
  return (
    <article
      className={`relative flex h-full flex-col rounded-xl border-2 bg-white p-3 shadow-sm transition-all duration-700 md:p-4 ${
        dimmed ? 'border-slate-100 opacity-40 grayscale' : focused ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-slate-200'
      } ${className}`}
    >
      {scoreMeta ? (
        <div className="absolute right-2 top-2 z-10 rounded-lg bg-slate-900/90 px-2 py-1 text-[10px] font-bold text-white">
          {animateScore && validated ? (
            <span>
              <span className="text-slate-400 line-through">{scoreMeta.before}%</span>{' '}
              <span className="text-emerald-300">→ {scoreMeta.after}%</span>
            </span>
          ) : (
            <span>{scoreMeta.after}%</span>
          )}
        </div>
      ) : null}
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
 *   validationFocus?: boolean,
 *   boxScores?: Record<string, { before?: number, after?: number, status?: string, evidenceCount?: number }>,
 *   animateScores?: boolean,
 *   headerMeta?: { weekLabel?: string, dayLabel?: string, subtitle?: string },
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
  validationFocus = false,
  boxScores = {},
  animateScores = true,
  headerMeta,
}) {
  const topBoxes = FEC_LAYOUT_SIMPLE_BOXES.filter((b) => b.grid === 'top');
  const partnersBox = FEC_LAYOUT_SIMPLE_BOXES.find((b) => b.grid === 'below-center');

  const growthContent = complexContents.growth_engines ?? {};
  const financialContent = complexContents.financial_engine ?? {};
  const roadmapContent = complexContents.venture_roadmap ?? {};
  const dashboardContent = complexContents.measurement_dashboard ?? {};

  const activeBoxIds = new Set(['who_we_serve', 'problem_we_solve', 'client_experience', 'winning_strategy']);
  const dimClass = validationFocus ? 'opacity-35 grayscale pointer-events-none' : '';

  const weekBadge = headerMeta?.weekLabel ?? 'Week 1';
  const dayBadge = headerMeta?.dayLabel ?? 'Day 4';
  const subtitle = headerMeta?.subtitle ?? FEC_LAYOUT_SUBTITLE;

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
                {weekBadge}
              </span>
              <span className="rounded-full border-2 border-spike px-2 py-0.5 text-[10px] font-black uppercase text-spike">
                {dayBadge}
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
            {subtitle}
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
        <div className="grid gap-3 lg:grid-cols-12">
          {/* Row 1 — four customer/strategy boxes */}
          {topBoxes.map((box) => (
            <div key={box.id} className="lg:col-span-3">
              <FecSimpleBox
                {...box}
                mode={mode}
                content={boxContents[box.id]}
                scoreMeta={boxScores[box.id]}
                animateScore={animateScores}
                focused={validationFocus && activeBoxIds.has(box.id)}
                dimmed={validationFocus && !activeBoxIds.has(box.id)}
              />
            </div>
          ))}

          {/* Row 2 — Growth | UVP center | Financial */}
          <div className={`lg:col-span-4 lg:row-start-2 ${dimClass}`}>
            <FecSideComplexBox
              box={FEC_GROWTH_ENGINES_BOX}
              mode={mode}
              columnContent={growthContent}
              compact
            />
          </div>
          <div className="lg:col-span-4 lg:col-start-5 lg:row-start-2">
            <FecUvpCenter
              mode={mode}
              centerContent={centerContent}
              uvpDetailContent={uvpDetailContent}
              scoreMeta={boxScores.uvp}
              animateScore={animateScores}
              focused={validationFocus}
            />
          </div>
          <div className={`lg:col-span-4 lg:col-start-9 lg:row-start-2 ${dimClass}`}>
            <FecSideComplexBox
              box={FEC_FINANCIAL_ENGINE_BOX}
              mode={mode}
              columnContent={financialContent}
              compact
            />
          </div>

          {/* Row 3 — Key partners under UVP */}
          {partnersBox ? (
            <div className={`lg:col-span-4 lg:col-start-5 lg:row-start-3 ${dimClass}`}>
              <FecSimpleBox {...partnersBox} mode={mode} content={boxContents[partnersBox.id]} dimmed={validationFocus} />
            </div>
          ) : null}

          {/* Row 4 — Roadmap + Dashboard side by side */}
          <article className={`overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-sm lg:col-span-6 lg:row-start-4 ${dimClass}`}>
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

          <article className={`overflow-hidden rounded-xl border-2 border-slate-200 bg-white shadow-sm lg:col-span-6 lg:col-start-7 lg:row-start-4 ${dimClass}`}>
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
            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 md:p-4">
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
