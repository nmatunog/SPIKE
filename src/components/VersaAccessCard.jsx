import React, { memo, useEffect, useState } from 'react';
import { VersaCodeGate } from './VersaCodeGate.jsx';
import { fetchVersaAccess, fetchVersaGateStatus, redeemVersaAccessCode } from '../lib/versaCodeGateService.js';

/** Post-login My Learning / Access. Hidden when the Versa gate flag is off. */
export const VersaAccessCard = memo(function VersaAccessCard() {
  const [enabled, setEnabled] = useState(false);
  const [entitlements, setEntitlements] = useState([]);
  const [loadError, setLoadError] = useState('');

  const refresh = async () => {
    const status = await fetchVersaGateStatus();
    if (!status?.enabled) {
      setEnabled(false);
      return;
    }
    setEnabled(true);
    try {
      const access = await fetchVersaAccess();
      setEntitlements(access?.entitlements || []);
    } catch (err) {
      setLoadError(err?.message || 'Could not load access.');
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const status = await fetchVersaGateStatus();
      if (cancelled) return;
      if (!status?.enabled) {
        setEnabled(false);
        return;
      }
      setEnabled(true);
      try {
        const access = await fetchVersaAccess();
        if (!cancelled) setEntitlements(access?.entitlements || []);
      } catch (err) {
        if (!cancelled) setLoadError(err?.message || 'Could not load access.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!enabled) return null;

  const handleVerify = async (code) => {
    const result = await redeemVersaAccessCode(code);
    await refresh();
    return result;
  };

  return (
    <div className="mx-auto mt-4 w-full max-w-md px-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        My Learning / Access
      </h2>
      {loadError ? <p className="mb-2 text-sm text-red-700">{loadError}</p> : null}
      {entitlements.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {entitlements.map((item) => (
            <li
              key={`${item.offering_id}-${item.granted_at}`}
              className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
            >
              Access verified — {item.level === 'L1' ? 'Financial Literacy (L1)' : item.offering_id} ({item.level})
            </li>
          ))}
        </ul>
      ) : (
        <VersaCodeGate onVerify={handleVerify} signedIn requireSignIn={false} />
      )}
    </div>
  );
});
