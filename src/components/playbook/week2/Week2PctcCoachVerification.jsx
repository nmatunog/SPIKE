import { useMemo } from 'react';
import { Check, ExternalLink, X } from 'lucide-react';
import { groupInternsBySquad } from '../../../lib/mentorFrameworkService.js';
import { deriveSquadPctcCertificateMetrics } from '../../../lib/customerDiscovery/week2PctcCertificateService.js';
import { openPctcCertificate } from '../../../lib/customerDiscovery/week2PctcCertificateService.js';

/**
 * Coach / mentor — per-intern PCTC certificate verification.
 * @param {{ interns: Array<{ id: string, name?: string, squad?: string }> }} props
 */
export function Week2PctcCoachVerification({ interns }) {
  const squads = useMemo(() => groupInternsBySquad(interns), [interns]);

  if (!squads.length) return null;

  return (
    <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <header className="mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">PCTC certificate verification</p>
        <p className="text-sm text-slate-600">Open each intern&apos;s uploaded AIA LMS certificates.</p>
      </header>
      <div className="space-y-4">
        {squads.map((squad) => {
          const memberIds = (squad.members ?? []).map((m) => m.id);
          const metrics = deriveSquadPctcCertificateMetrics(memberIds);
          const nameById = Object.fromEntries((squad.members ?? []).map((m) => [m.id, m.name || m.id.slice(0, 8)]));

          return (
            <div key={squad.name}>
              <p className="text-sm font-bold text-slate-900">
                {squad.name}{' '}
                <span className="font-normal text-slate-500">
                  · both certs {metrics.bothPct}%
                </span>
              </p>
              <ul className="mt-2 space-y-2">
                {metrics.members.map((member) => (
                  <li key={member.participantId} className="rounded-lg border border-white bg-white px-3 py-2 text-sm">
                    <p className="font-medium text-slate-900">{nameById[member.participantId]}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {member.slots.map((slot) => (
                        <CertBadge
                          key={slot.slot}
                          label={slot.slot === 1 ? 'Cert 1' : 'Cert 2'}
                          uploaded={slot.uploaded}
                          deliverable={slot.deliverable}
                        />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** @param {{ label: string, uploaded: boolean, deliverable?: object | null }} props */
function CertBadge({ label, uploaded, deliverable }) {
  if (!uploaded || !deliverable) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
        <X size={12} /> {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void openPctcCertificate(deliverable)}
      className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-200"
    >
      <Check size={12} /> {label}
      <ExternalLink size={10} />
    </button>
  );
}
