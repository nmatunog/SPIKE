import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { aggregateCoachAnalytics } from '../../lib/ventureCoachService.js';
import {
  AMBITION_MOTIVATOR_CARDS,
  COACH_VALUE_CARDS,
  PURPOSE_DRIVERS,
} from '../../lib/ventureCoachConstants.js';
import { ROUTES } from '../../routes/paths.js';

export function CohortIdentityAnalyticsPage() {
  const analytics = aggregateCoachAnalytics();

  return (
    <PageContainer wide>
      <Link to={ROUTES.dashboard} className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-spike">
        <ArrowLeft size={16} /> Back to dashboard
      </Link>

      <header className="mb-6 flex items-start gap-3">
        <BarChart3 className="mt-1 text-spike" size={28} />
        <div>
          <p className="spike-label text-spike">Faculty Analytics</p>
          <h1 className="text-2xl font-bold text-slate-900">Cohort Identity & Venture Coach</h1>
          <p className="mt-1 text-sm text-slate-600">
            Aggregated from {analytics.profileCount} participant coach profile(s) in this browser.
          </p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsList title="Top Ambitions" items={analytics.topMotivators} options={AMBITION_MOTIVATOR_CARDS} />
        <AnalyticsList title="Top Values (Public Top 3)" items={analytics.topValues} options={COACH_VALUE_CARDS} />
        <AnalyticsList title="Top Purpose Drivers" items={analytics.topPurposeDrivers} options={PURPOSE_DRIVERS} />
        <TaglineList title="Most Common Taglines" items={analytics.topTaglines} />

        <section className="spike-card lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Career Track Distribution</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <TrackStat label="Agency Builder" value={analytics.trackDistribution.agency_builder} />
            <TrackStat label="Specialist Consultant" value={analytics.trackDistribution.specialist_consultant} />
            <TrackStat label="Still Exploring" value={analytics.trackDistribution.undecided} />
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

/**
 * @param {{ title: string, items: Array<{ id: string, count: number }>, options: Array<{ id: string, label: string }> }} props
 */
function AnalyticsList({ title, items, options }) {
  return (
    <section className="spike-card">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No data yet — participants complete AI Venture Coach to populate.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span>{options.find((o) => o.id === item.id)?.label ?? item.id}</span>
              <span className="font-bold text-spike">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** @param {{ title: string, items: Array<{ id: string, count: number }> }} props */
function TaglineList({ title, items }) {
  return (
    <section className="spike-card">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No taglines saved yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className="capitalize">{item.id}</span>
              <span className="font-bold text-spike">{item.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** @param {{ label: string, value: number }} props */
function TrackStat({ label, value }) {
  return (
    <div className="rounded-xl bg-spike-muted px-4 py-5 text-center">
      <p className="text-3xl font-bold text-spike">{value}%</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{label}</p>
    </div>
  );
}
