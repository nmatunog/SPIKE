import { Loader2, Shield } from 'lucide-react';
import { GuestBootstrapForm } from '../components/GuestBootstrapForm.jsx';
import { GuestLoginForm } from '../components/GuestLoginForm.jsx';
import { InternSignupPanel } from '../components/InternSignupPanel.jsx';
import { listMockAuthAccountHints } from '../lib/mockAuthUsers.js';

/**
 * @param {{
 *   usingSupabaseAuth: boolean,
 *   mockAuthEnabled: boolean,
 *   setupLoadState: string,
 *   setupLoadError: string,
 *   setupMeta: object | null,
 *   onRetrySetup: () => void,
 *   onBootstrap: (payload: object) => Promise<void>,
 *   onLogin: (email: string, password: string) => Promise<void>,
 *   onRequestPasswordHelp?: (email: string, note: string) => Promise<void>,
 *   onInternSignup: (payload: object) => Promise<void>,
 * }} props
 */
export function WelcomePage({
  usingSupabaseAuth,
  mockAuthEnabled,
  setupLoadState,
  setupLoadError,
  setupMeta,
  onRetrySetup,
  onBootstrap,
  onLogin,
  onRequestPasswordHelp,
  onInternSignup,
}) {
  return (
      <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-spike-muted/80 to-transparent lg:h-72 2xl:h-80"
      />

      <div className="relative mx-auto flex w-full max-w-md flex-col items-center px-4 py-10 sm:max-w-lg sm:py-14 lg:max-w-xl lg:py-16 2xl:max-w-2xl">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-spike text-xl font-bold text-white shadow-card">
          S
        </div>

        <h1 className="text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
          Welcome to SPIKE
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-600 sm:text-base lg:text-lg">
          {usingSupabaseAuth
            ? 'Sign in to continue your Venture Blueprint, Playbook, and research work.'
            : 'Sign in with the account your administrator created for you.'}
        </p>

        {setupLoadState === 'loading' ? (
          <div className="mt-10 flex flex-col items-center gap-3 text-slate-600">
            <Loader2 className="animate-spin text-spike" size={32} />
            <p className="text-sm font-medium">Checking setup…</p>
          </div>
        ) : null}

        {setupLoadState === 'error' ? (
          <div className="mt-8 w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="mb-3 font-medium">{setupLoadError}</p>
            <button type="button" onClick={onRetrySetup} className="spike-btn-primary !bg-amber-900 hover:!bg-amber-950">
              Retry
            </button>
          </div>
        ) : null}

        {setupLoadState === 'ok' ? (
          <div className="mt-8 w-full space-y-4">
            {setupMeta?.needsBootstrap ? (
              <GuestBootstrapForm
                secretRequired={!!setupMeta.secretRequired}
                onSubmit={onBootstrap}
              />
            ) : null}

            {setupMeta?.needsBootstrap ? (
              <p className="text-center text-2xs font-semibold uppercase tracking-wide text-slate-400">
                Already set up?
              </p>
            ) : null}

            <GuestLoginForm
              heading={setupMeta?.needsBootstrap ? 'Sign in instead' : 'Sign in to SPIKE'}
              onLogin={onLogin}
              usingSupabaseAuth={usingSupabaseAuth}
              mockAuthEnabled={mockAuthEnabled}
              mockAccounts={mockAuthEnabled ? listMockAuthAccountHints() : []}
              onRequestPasswordHelp={usingSupabaseAuth ? onRequestPasswordHelp : undefined}
            />

            {usingSupabaseAuth ? <InternSignupPanel onSignup={onInternSignup} /> : null}
          </div>
        ) : null}

        {usingSupabaseAuth && setupLoadState !== 'ok' ? (
          <div className="mt-4 w-full">
            <InternSignupPanel onSignup={onInternSignup} />
          </div>
        ) : null}

        <p className="mt-8 flex items-center gap-2 text-2xs text-slate-400">
          <Shield size={14} aria-hidden />
          AIA PH Matunog District · Secure program portal
        </p>
      </div>
    </div>
  );
}
