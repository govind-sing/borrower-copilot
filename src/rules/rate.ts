import { LenderSideInput, LenderSanctionResult } from "./types";
import { foirCeiling, creditTier, multiplierForCreditTier, rateBandForTier } from "./foir";
import { principalForEmi } from "./apr";

export function lenderSanction(p: LenderSideInput): LenderSanctionResult {
  const foir = foirCeiling({
    employmentType: p.employmentType,
    monthlyIncome: p.lenderIncome,
    bounceLast12mo: p.bounceLast12mo,
    businessVintageYears: p.businessVintageYears,
  });
  const affordableEMI = Math.max(0, (p.lenderIncome * foir.pct) / 100 - p.existingEMIs);
  const tier = creditTier(p.creditScore);
  const rate = rateBandForTier(tier, p.secured);
  const midRate = (rate.low + rate.high) / 2;
  const principalFromFoir = principalForEmi(affordableEMI, midRate, p.tenureMonths);

  let principalFromMultiplier: number | null = null;
  let cap = principalFromFoir;

  if (!p.secured) {
    principalFromMultiplier = p.lenderIncome * multiplierForCreditTier(tier);
    cap = Math.min(principalFromFoir, principalFromMultiplier);
  } else {
    const ltvCap = (p.collateralValue * p.ltvPct) / 100;
    cap = Math.min(principalFromFoir, ltvCap);
  }

  return {
    amount: Math.round(cap),
    foir,
    rate,
    tier,
    affordableEMI: Math.round(affordableEMI),
    principalFromFoir: Math.round(principalFromFoir),
    principalFromMultiplier: principalFromMultiplier != null ? Math.round(principalFromMultiplier) : null,
  };
}