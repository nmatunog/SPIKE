import { useState } from 'react';
import { VersaCodeGate } from '../components/VersaCodeGate.jsx';
import { VERSA_GENERIC_DENY, VERSA_HELP_PLACEHOLDER } from '../lib/versaCodeGateService.js';

/**
 * Isolated SPIKE × Versa activation demo. DEV-only route.
 * Not wired into intern signup, Welcome, or the intern dashboard.
 */
export function VersaActivateHarness() {
  const [helpText] = useState(VERSA_HELP_PLACEHOLDER);
  const [last, setLast] = useState(null);

  const onVerify = async (code) => {
    const trimmed = String(code || '').trim();
    if (!trimmed) throw new Error(VERSA_GENERIC_DENY);
    if (trimmed.toUpperCase() === 'SYN-L1-VALID-DEMO') {
      const result = {
        confirmation: 'Access verified — Financial Literacy (L1)',
        continueLabel: 'Continue to SPIKE Learning',
      };
      setLast(result);
      return result;
    }
    throw new Error(VERSA_GENERIC_DENY);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-4">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-amber-700">
          Isolated harness — not the live intern flow
        </p>
        <VersaCodeGate
          heading="Activate your SPIKE access"
          helpText={helpText}
          signedIn
          onVerify={onVerify}
        />
        {last ? (
          <p className="text-center text-xs text-slate-500">Synthetic demo only. No live inventory.</p>
        ) : null}
      </div>
    </div>
  );
}

export default VersaActivateHarness;
