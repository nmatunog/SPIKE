import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { OnboardingPhotoCapture } from '../../components/onboarding/OnboardingPhotoCapture.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { useAuth } from '../../AuthContext.jsx';
import { setOnboardingCompleteCache } from '../../lib/cohortOnboardingService.js';
import { isMockUserId, updateMockInternProgress } from '../../lib/mockAuth.js';
import { completeRaSpikeOnboarding } from '../../lib/raSpikeSignupService.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * RA-SPIKE onboarding step 3 — optional profile photo.
 * @param {{ user?: { id: string, internProgress?: object | null } }} props
 */
export function RaSpikeOnboardingPage({ user }) {
  const navigate = useNavigate();
  const { token, refreshUser } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function finish(payload = {}) {
    setBusy(true);
    setError('');
    try {
      if (user?.id && isMockUserId(user.id)) {
        updateMockInternProgress(user.id, {
          onboarding_complete: true,
          onboarding_welcomed_at: new Date().toISOString(),
        });
        if (payload.avatarUrl) {
          /* avatar stored on profile in production; mock skips photo persistence */
        }
      } else if (token) {
        await completeRaSpikeOnboarding(token, payload);
      }
      if (user?.id) setOnboardingCompleteCache(user.id, true);
      await refreshUser?.();
      navigate(ROUTES.raSpikeHome, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete onboarding.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <RaSpikeShell user={user} showContextBar={false}>
      <PageContainer>
        <div className="mx-auto max-w-lg space-y-6 text-center">
          <header>
            <p className="text-sm font-semibold uppercase tracking-wider text-spike">Step 3 of 3</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Add a profile photo</h1>
            <p className="mt-2 text-sm text-slate-600">Optional — helps your squad and coaches recognize you.</p>
          </header>

          <section className="spike-card">
            <OnboardingPhotoCapture
              label="Upload photo"
              hint="JPG or PNG, under 2.5 MB"
              disabled={busy}
              onUpload={async (dataUrl) => {
                await finish({ avatarUrl: dataUrl });
              }}
            />
          </section>

          {error ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
          ) : null}

          <button
            type="button"
            disabled={busy}
            onClick={() => finish({ skipPhoto: true })}
            className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Skip for now
          </button>
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
