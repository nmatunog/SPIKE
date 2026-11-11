import React, { memo, useState } from 'react';
import { VERSA_GENERIC_DENY, VERSA_HELP_PLACEHOLDER } from '../lib/versaCodeGateService.js';

/**
 * Flag-gated UX over server verification. No frontend validation of codes,
 * no URL/query persistence, no browser storage of the pasted value.
 */
export const VersaCodeGate = memo(function VersaCodeGate({
  heading = 'Activate your SPIKE access',
  onVerify,
  requireSignIn = false,
  signedIn = false,
  helpText = VERSA_HELP_PLACEHOLDER,
  continueLabel = 'Continue to SPIKE Learning',
}) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (requireSignIn && !signedIn) {
      setStatus('error');
      setMessage('Sign in or create your account first, then verify your access code.');
      return;
    }
    setStatus('checking');
    try {
      const result = await onVerify(code);
      setStatus('granted');
      setMessage(result?.confirmation || 'Access verified');
      setCode('');
    } catch (err) {
      setStatus('error');
      setMessage(err?.message || VERSA_GENERIC_DENY);
    }
  };

  const busy = status === 'checking';

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-2xs font-semibold uppercase tracking-wide text-slate-400">SPIKE × Versa</p>
      <h2 className="mt-1 text-base font-semibold text-slate-900">{heading}</h2>
      <p className="mt-1 text-xs text-slate-500">
        Paste your access code. Do not put it in the address bar.
      </p>

      {status === 'idle' && code.trim() ? (
        <p className="mt-3 text-sm font-medium text-slate-600" aria-live="polite">
          Code received
        </p>
      ) : null}
      {status === 'checking' ? (
        <p className="mt-3 text-sm font-medium text-slate-600" aria-live="polite">
          Checking access…
        </p>
      ) : null}
      {status === 'granted' ? (
        <div className="mt-3 rounded-xl bg-emerald-50 p-2.5 text-sm text-emerald-800" role="status">
          <p>{message}</p>
          <p className="mt-1 font-semibold">{continueLabel}</p>
        </div>
      ) : null}
      {status === 'error' ? (
        <p className="mt-3 rounded-xl bg-red-50 p-2.5 text-sm text-red-700" role="alert">
          {message}
        </p>
      ) : null}

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Access code</span>
          <input
            id="versa-access-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20"
            autoComplete="off"
            inputMode="text"
            spellCheck={false}
            disabled={busy || status === 'granted'}
            aria-describedby="versa-access-code-help"
          />
        </label>
        <p id="versa-access-code-help" className="text-xs text-slate-500">
          Enter or paste your access code.
        </p>
        <button type="submit" disabled={busy || !code.trim() || status === 'granted'} className="spike-btn-primary w-full">
          {busy ? 'Checking access…' : 'Verify & Continue'}
        </button>
      </form>

      <button
        type="button"
        className="mt-3 text-xs font-semibold text-spike hover:underline"
        onClick={() => setHelpOpen((open) => !open)}
      >
        Where do I find my code?
      </button>
      {helpOpen ? (
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{helpText}</p>
      ) : null}
    </section>
  );
});
