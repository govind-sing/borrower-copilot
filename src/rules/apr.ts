export function emiForPrincipal(principal: number, annualRatePct: number, months: number): number {
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export function principalForEmi(emi: number, annualRatePct: number, months: number): number {
  const r = annualRatePct / 12 / 100;
  if (emi <= 0) return 0;
  if (r === 0) return emi * months;
  return (emi * (1 - Math.pow(1 + r, -months))) / r;
}

// APR: annualized IRR given principal, upfront processing fee %, nominal rate, tenure
export function computeAPR(
  principal: number,
  feePct: number,
  annualRatePct: number,
  months: number
): number {
  const emi = emiForPrincipal(principal, annualRatePct, months);
  const netDisbursed = principal * (1 - feePct / 100);

  const npv = (rMonthly: number) => {
    let pv = 0;
    for (let t = 1; t <= months; t++) pv += emi / Math.pow(1 + rMonthly, t);
    return pv - netDisbursed;
  };

  let lo = 0.0001;
  let hi = 2.0;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (npv(mid) > 0) lo = mid;
    else hi = mid;
  }
  const rMonthly = (lo + hi) / 2;
  return (Math.pow(1 + rMonthly, 12) - 1) * 100;
}