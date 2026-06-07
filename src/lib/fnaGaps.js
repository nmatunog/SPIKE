/**
 * Suggested protection / retirement gaps for FNA Engine (educational estimates).
 * @param {{ clientAge?: number | null, income?: number | null, assets?: number | null, liabilities?: number | null }} input
 */
export function suggestFnaGaps(input) {
  const age = input.clientAge ?? 35;
  const income = Number(input.income) || 0;
  const assets = Number(input.assets) || 0;
  const liabilities = Number(input.liabilities) || 0;

  const yearsToRetirement = Math.max(0, 65 - age);
  const annualNeed = income * 0.7;
  const retirementTarget = annualNeed * yearsToRetirement * 0.5;
  const retirementGap = Math.max(0, Math.round(retirementTarget - assets * 0.4));

  const protectionNeed = Math.max(liabilities, income * 10);
  const protectionGap = Math.max(0, Math.round(protectionNeed - assets * 0.25));

  return { protectionGap, retirementGap };
}
