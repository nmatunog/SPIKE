/** Canonical RA-SPIKE agencies and units — rookie signup and staff batch creation. */

/** @type {Record<string, string[]>} */
export const RA_SPIKE_AGENCY_UNITS = {
  'Cebu Matunog Agency': [
    'Aringay',
    'CMA Direct',
    'Jaldon',
    'Rio Matunog',
    'Recla',
    'Geolagon',
  ],
  'Cebu Ez Premier Agency': [
    'Ez Premier Direct',
    'HVS Direct',
    'LTA Direct',
    'JG Elite (Baculan)',
    'JB Miracle (Balisco)',
    'JFE Financials (Erazo)',
    'G-Consult (Iway)',
    'RLB (Recto)',
    'Canu-og',
    'DLP Elite (Perez)',
    'Mondero',
    'Other',
  ],
};

export const RA_SPIKE_AGENCIES = Object.keys(RA_SPIKE_AGENCY_UNITS);

/** @param {string} agency */
export function raSpikeUnitsForAgency(agency) {
  return RA_SPIKE_AGENCY_UNITS[agency] ?? [];
}

/** Canonical home-agency + unit lists for participant signup (not batch enrollment). */
export function raSpikeHomeOrgOptions() {
  return RA_SPIKE_AGENCIES.map((agency) => ({
    agency,
    units: raSpikeUnitsForAgency(agency),
  }));
}

/**
 * @deprecated Batches are mixed-cohort; use {@link raSpikeHomeOrgOptions} + flat batch list.
 */
export function mergeRaSpikeEnrollmentOptions(apiAgencies = []) {
  const byAgency = new Map((apiAgencies ?? []).map((a) => [a.agency, a]));

  return RA_SPIKE_AGENCIES.map((agencyName) => {
    const api = byAgency.get(agencyName);
    const dbUnits = api?.unitManagers ?? [];
    const dbByUnit = new Map(dbUnits.map((u) => [u.unitManager, u.batches ?? []]));
    const canonical = raSpikeUnitsForAgency(agencyName);

    /** @type {Array<{ unitManager: string, batches: object[] }>} */
    const unitManagers = canonical.map((unitManager) => ({
      unitManager,
      batches: dbByUnit.get(unitManager) ?? [],
    }));

    for (const u of dbUnits) {
      if (!canonical.includes(u.unitManager)) {
        unitManagers.push({
          unitManager: u.unitManager,
          batches: u.batches ?? [],
        });
      }
    }

    return { agency: agencyName, unitManagers };
  });
}
