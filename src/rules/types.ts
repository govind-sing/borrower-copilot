export type EmploymentType = "salaried" | "self_employed" | "informal";
export type CreditTier = "750+" | "700-749" | "650-699" | "<650" | "unknown";

export interface LenderSideInput {
  lenderIncome: number;
  existingEMIs: number;
  employmentType: EmploymentType;
  bounceLast12mo: boolean;
  businessVintageYears: number;
  creditScore: number | null;
  tenureMonths: number;
  secured: boolean;
  collateralValue: number;
  ltvPct: number;
}

export interface SafeSideInput {
  safeIncome: number;
  householdExpenses: number;
  existingEMIs: number;
  employmentType: EmploymentType;
  dependents: number;
  singleIncomeUnemployedSpouse: boolean;
  emergencySavingsMonths: number;
  tenureMonths: number;
  midRate: number;
}

export interface RateBand {
  low: number;
  high: number;
}

export interface FoirResult {
  pct: number;
  why: string;
}

export interface ReserveResult {
  pct: number;
  why: string;
}

export interface LenderSanctionResult {
  amount: number;
  foir: FoirResult;
  rate: RateBand;
  tier: CreditTier;
  affordableEMI: number;
  principalFromFoir: number;
  principalFromMultiplier: number | null;
}

export interface SafeCapacityResult {
  safeEMI: number;
  principal: number;
  reserve: ReserveResult;
  bindingRule: string;
}

export interface VerdictResult {
  call: "DON'T BORROW" | "BORROW LESS" | "BORROW";
  why: string;
}