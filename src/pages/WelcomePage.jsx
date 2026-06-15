import { Loader2, Shield } from 'lucide-react';
import { SpikeLogo } from '../components/brand/SpikeLogo.jsx';
import { GuestBootstrapForm } from '../components/GuestBootstrapForm.jsx';
import { GuestLoginForm } from '../components/GuestLoginForm.jsx';
import { InternSignupPanel } from '../components/InternSignupPanel.jsx';
import { StaffSignupPanel } from '../components/StaffSignupPanel.jsx';
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
 *   onStaffSignup: (payload: object) => Promise<void>,
 *   staffBootstrapMode?: boolean,
 *   bootstrapSecretRequired?: boolean,
 *   bootstrapApiConfigured?: boolean,
 *   onSupabaseBootstrap?: (payload: object) => Promise<void>,
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
  onStaffSignup,
  staffBootstrapMode = false,
  bootstrapSecretRequired = false,
  bootstrapApiConfigured = true,
  onSupabaseBootstrap,
}) {
  return (
      <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-spike-muted/80 to-transparent lg:h-72 2xl:h-80"
      />

      <div className="relative mx-auto flex w-full max-w-md flex-col items-center px-4 py-10 sm:max-w-lg sm:py-14 lg:max-w-xl lg:py-16 2xl:max-w-2xl">
        <SpikeLogo size="lg" className="mb-6 h-14 sm:h-16" />

        <h1 className="text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
          Welcome
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
            {usingSupabaseAuth && staffBootstrapMode && onSupabaseBootstrap ? (
              <>
                {!bootstrapApiConfigured ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                    <p className="font-medium">Superuser setup API is not configured yet.</p>
                    <p className="mt-2 text-xs leading-relaxed">
                      In Cloudflare Pages → spike → Settings → Environment variables, add{' '}
                      <code className="rounded bg-white/80 px-1">SUPABASE_SERVICE_ROLE_KEY</code> (from
                      Supabase → Project Settings → API), then redeploy. Until then, create the user in
                      Supabase → Authentication → Users and run the SUPERUSER SQL promotion.
                    </p>
                  </div>
                ) : null}
                <GuestBootstrapForm
                  secretRequired={bootstrapSecretRequired}
                  onSubmit={onSupabaseBootstrap}
                />
                <p className="text-center text-2xs font-semibold uppercase tracking-wide text-slate-400">
                  Already set up?
                </p>
                <GuestLoginForm
                  heading="Sign in to SPIKE"
                  onLogin={onLogin}
                  usingSupabaseAuth={usingSupabaseAuth}
                  mockAuthEnabled={mockAuthEnabled}
                  mockAccounts={mockAuthEnabled ? listMockAuthAccountHints() : []}
                  onRequestPasswordHelp={onRequestPasswordHelp}
                />
              </>
            ) : (
              <>
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
                {usingSupabaseAuth ? <StaffSignupPanel onSignup={onStaffSignup} /> : null}

                {usingSupabaseAuth &&
                !staffBootstrapMode &&
                bootstrapSecretRequired &&
                onSupabaseBootstrap &&
                bootstrapApiConfigured ? (
                  <details className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
                    <summary className="cursor-pointer font-medium text-slate-900">
                      Reset superuser password (setup secret)
                    </summary>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      Use this if a superuser account already exists but sign-in fails. Requires the
                      setup secret configured in Cloudflare.
                    </p>
                    <div className="mt-4">
                      <GuestBootstrapForm secretRequired onSubmit={onSupabaseBootstrap} />
                    </div>
                  </details>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {usingSupabaseAuth && setupLoadState !== 'ok' && !staffBootstrapMode ? (
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
