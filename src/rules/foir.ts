import { EmploymentType, CreditTier, RateBand, FoirResult } from "./types";

const FOIR_TABLE: Record<EmploymentType, [number, number][]> = {
  salaried: [[50000, 40], [150000, 50], [Infinity, 60]],
  self_employed: [[50000, 35], [150000, 45], [Infinity, 55]],
  informal: [[50000, 30], [150000, 40], [Infinity, 50]],
};

export function foirCeiling(params: {
  employmentType: EmploymentType;
  monthlyIncome: number;
  bounceLast12mo: boolean;
  businessVintageYears: number;
}): FoirResult {
  const { employmentType, monthlyIncome, bounceLast12mo, businessVintageYears } = params;
  const tiers = FOIR_TABLE[employmentType];
  const match = tiers.find(([cap]) => monthlyIncome < cap);
  let pct = match ? match[1] : tiers[tiers.length - 1][1];
  const why: string[] = [`base ${pct}% for ${employmentType} at this income tier`];

  if (bounceLast12mo) {
    pct -= 10;
    why.push("−10pp: bounce in last 12 months");
  }
  if (employmentType === "self_employed" && businessVintageYears >= 10) {
    pct += 5;
    why.push("+5pp: ≥10yr business vintage");
  }
  return { pct: Math.max(pct, 0), why: why.join("; ") };
}

export function creditTier(score: number | null): CreditTier {
  if (score == null) return "unknown";
  if (score >= 750) return "750+";
  if (score >= 700) return "700-749";
  if (score >= 650) return "650-699";
  return "<650";
}

export function multiplierForCreditTier(tier: CreditTier): number {
  const table: Record<CreditTier, number> = {
    "750+": 20,
    "700-749": 16,
    "650-699": 12,
    "<650": 8,
    unknown: 6,
  };
  return table[tier];
}

export function rateBandForTier(tier: CreditTier, secured: boolean): RateBand {
  if (secured) return { low: 9, high: 13 };
  const table: Record<CreditTier, RateBand> = {
    "750+": { low: 10.5, high: 12 },
    "700-749": { low: 12, high: 15 },
    "650-699": { low: 15, high: 18 },
    "<650": { low: 18, high: 24 },
    unknown: { low: 17, high: 21 },
  };
  return table[tier];
}