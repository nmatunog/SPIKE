import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Layers } from 'lucide-react';
import { PageContainer } from '../../../components/layout/PageContainer.jsx';
import { CONTENT_STUDIO_NAV } from '../../../lib/contentStudioConstants.js';
import { ROUTES } from '../../../routes/paths.js';

/** @param {{ children: import('react').ReactNode }} props */
export function ContentStudioShell({ children }) {
  const location = useLocation();

  return (
    <PageContainer wide>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="spike-label text-spike">Sprint 06A</p>
          <h1 className="text-2xl font-bold text-slate-900">Content Studio™</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Author, version, and publish SPIKE curriculum — segments through sessions — without code changes.
          </p>
        </div>
        <Link to={ROUTES.admin} className="spike-btn-secondary text-sm">
          ← Admin
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="spike-card h-fit space-y-1 p-3">
          <p className="mb-2 flex items-center gap-2 px-2 text-2xs font-bold uppercase tracking-wide text-slate-500">
            <Layers size={14} /> Navigation
          </p>
          {CONTENT_STUDIO_NAV.map((item) => {
            const active = item.end
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-spike text-white'
                    : 'text-slate-700 hover:bg-spike-muted/40 hover:text-spike'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </PageContainer>
  );
}

/** @param {{ title: string, description?: string, children?: import('react').ReactNode }} props */
export function ContentStudioPanel({ title, description, children }) {
  return (
    <section className="spike-card space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-spike-muted/50 p-2 text-spike">
          <BookOpen size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

/** @param {{ status: string }} props */
export function StatusBadge({ status }) {
  const tone =
    status === 'published'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'review'
        ? 'bg-amber-100 text-amber-800'
        : status === 'archived'
          ? 'bg-gray-100 text-gray-600'
          : 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-2xs font-bold uppercase ${tone}`}>
      {status}
    </span>
  );
}
