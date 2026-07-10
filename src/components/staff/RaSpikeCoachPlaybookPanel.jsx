import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { RA_SPIKE_PROGRAM } from '../../lib/programs/ra-spike.js';
import { getRaSpikeWeekContent } from '../../lib/raSpikeContentLoader.js';
import { fetchRaSpikeWeekPublishStats } from '../../lib/staffRaSpikeWeekPublishService.js';
import {
  ROUTES,
  raSpikePlaybookDiscoveryCanvasHref,
  raSpikePlaybookFecIntroHref,
  raSpikePlaybookStepHref,
} from '../../routes/paths.js';

/** @param {{ workshopAction?: { type?: string, label?: string } | null, assignmentAction?: { type?: string, label?: string } | null }} week */
function weekToolLinks(week) {
  const content = getRaSpikeWeekContent(week);
  const links = [];
  const workshop = content.steps?.workshop?.action;
  const assignment = content.steps?.assignment?.action;

  if (workshop?.type === 'discovery-canvas') {
    links.push({ href: raSpikePlaybookDiscoveryCanvasHref(), label: workshop.label ?? 'Discovery Canvas' });
  }
  if (assignment?.type === 'fec-intro-wizard') {
    links.push({ href: raSpikePlaybookFecIntroHref(), label: assignment.label ?? 'FEC guided start' });
  }
  if (assignment?.type === 'dream-board') {
    links.push({ href: ROUTES.raSpikePlaybookDreamBoard, label: assignment.label ?? 'Dream Board' });
  }
  if (assignment?.type === 'canvas-wizard') {
    links.push({ href: ROUTES.raSpikePlaybookCanvasWizard, label: assignment.label ?? 'FEC canvas' });
  }

  links.push({
    href: `${ROUTES.raSpikePlaybook}?week=${week}`,
    label: `Week ${week} overview`,
  });
  links.push({
    href: raSpikePlaybookStepHref('learn', week),
    label: 'Learn step',
  });

  return links;
}

/** Coach-facing playbook browser — which week the cohort is on + preview links. */
export function RaSpikeCoachPlaybookPanel() {
  const [stats, setStats] = useState({ total: 0, minWeek: 1, maxWeek: 1, atWeek: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pickedWeek, setPickedWeek] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const next = await fetchRaSpikeWeekPublishStats();
      setStats(next);
      setPickedWeek((prev) => {
        if (prev >= 1 && prev <= 8) return prev;
        return next.maxWeek || 1;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load cohort week.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeWeek = pickedWeek || stats.maxWeek || 1;
  const weekContent = useMemo(() => getRaSpikeWeekContent(activeWeek), [activeWeek]);
  const tools = useMemo(() => weekToolLinks(activeWeek), [activeWeek]);

  return (
    <section className="rounded-2xl border-2 border-spike/30 bg-gradient-to-br from-spike-muted/40 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 shrink-0 text-spike" size={24} aria-hidden />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-spike">Playbook</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Coach playbook preview</h2>
            <p className="mt-1 text-sm text-slate-600">
              Browse what rookies see each week. Use <span className="font-semibold">Playbook</span> in the
              top nav, or open a week below.
            </p>
          </div>
        </div>
        <Link
          to={ROUTES.raSpikePlaybook}
          className="spike-btn-primary inline-flex min-h-[44px] items-center gap-1 px-4 text-sm"
        >
          Open playbook
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          Loading cohort week…
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          <p className="text-sm text-slate-700">
            {stats.total
              ? (
                <>
                  <span className="font-semibold">{stats.total}</span> rookie{stats.total === 1 ? '' : 's'}
                  {' '}— published through Week <span className="font-semibold text-spike">{stats.maxWeek}</span>
                  {stats.minWeek < stats.maxWeek
                    ? ` (some still on Week ${stats.minWeek})`
                    : null}
                </>
              )
              : 'No RA-SPIKE participants yet — publish Week 1 after enrollment.'}
          </p>

          <div className="flex flex-wrap gap-2">
            {Array.from({ length: RA_SPIKE_PROGRAM.totalWeeks }, (_, i) => i + 1).map((w) => {
              const count = stats.atWeek[w] ?? 0;
              const isActive = w === activeWeek;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => setPickedWeek(w)}
                  className={`min-h-[40px] rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-spike text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-spike/40'
                  }`}
                >
                  Week {w}
                  {count > 0 ? <span className="ml-1 text-xs opacity-80">({count})</span> : null}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">
              Week {activeWeek}: {weekContent.title}
            </p>
            <p className="mt-1 text-sm text-slate-600">{weekContent.theme}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                to={`${ROUTES.raSpikePlaybook}?week=${activeWeek}`}
                className="spike-btn-primary inline-flex min-h-[44px] items-center justify-center gap-1 px-4 text-sm"
              >
                Preview Week {activeWeek}
                <ArrowRight size={16} aria-hidden />
              </Link>
              {tools.filter((t) => !t.label.includes('overview') && !t.label.includes('Learn')).map((tool) => (
                <Link
                  key={tool.href}
                  to={tool.href}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-spike/30"
                >
                  {tool.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
