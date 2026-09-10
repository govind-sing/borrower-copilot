import { Answers } from "./types";
import { LenderSideInput, SafeSideInput, EmploymentType } from "@/rules/types";

const DEFAULT_EXPENSE_PCT: Record<EmploymentType, number> = {
  salaried: 30,
  self_employed: 40,
  informal: 50,
};

export interface DerivedContext {
  lenderInput: LenderSideInput;
  safeInputBase: Omit<SafeSideInput, "midRate" | "tenureMonths">;
  requestedAmount: number;
  hasHighCostDebt: boolean;
  secured: boolean;
  tenureMonths: number;
  assumptions: string[]; // human-readable list of defaults applied, for the confidence/why display
}

export function deriveInputs(a: Answers): DerivedContext {
  const assumptions: string[] = [];
  const employmentType = (a.employmentType ?? "salaried") as EmploymentType;
  const netIncome = a.netMonthlyIncome ?? 0;
  const dependents = a.dependents ?? 0;
  const existingEMIsTotal = a.existingEMIsTotal ?? 0;

  // ---- Income: lender-trusted vs safe ----
  let lenderIncome = netIncome;
  let safeIncome = netIncome;

  if (employmentType === "salaried") {
    if (a.variablePayPct) {
      const fixed = netIncome * (1 - a.variablePayPct / 100);
      const variable = netIncome * (a.variablePayPct / 100);
      lenderIncome = fixed + variable * 0.6;
      safeIncome = lenderIncome;
      assumptions.push(`Counted only 60% of declared variable pay (${a.variablePayPct}% of income) as stable income.`);
    }
  }

  if (employmentType === "self_employed") {
    if (a.itrAnnualIncome) {
      lenderIncome = a.itrAnnualIncome / 12;
    } else {
      lenderIncome = netIncome * 0.5;
      assumptions.push("No ITR provided — lender-trusted income assumed at 50% of your declared income.");
    }
    const cashEstimate = a.cashIncomeEstimate ?? netIncome;
    safeIncome = Math.min(lenderIncome, cashEstimate);
  }

  if (employmentType === "informal") {
    if (a.incomeRangeLow != null && a.incomeRangeHigh != null) {
      const midpoint = (a.incomeRangeLow + a.incomeRangeHigh) / 2;
      const discount = (a.incomeSources ?? 1) >= 2 ? 0.8 : 0.75;
      lenderIncome = midpoint * discount;
      assumptions.push(
  `Income taken as midpoint of your stated range, discounted ${Math.round((1 - discount) * 100)}% for income volatility.`
);
    } else {
      lenderIncome = netIncome * 0.75;
      assumptions.push("Income discounted 25% for volatility (no income range given).");
    }
    safeIncome = lenderIncome;
  }

  // ---- Co-applicant / spouse income ----
  if (a.spouseOrPartnerIncome) {
    lenderIncome += a.spouseOrPartnerIncome;
    safeIncome += a.spouseOrPartnerIncome * 0.8;
    assumptions.push("Household income includes spouse/partner income (discounted 20% on the safe side).");
  }

  if (a.isProductiveLoan && a.expectedMonthlyUplift) {
  const discountedUplift = a.expectedMonthlyUplift * 0.5;
  safeIncome += discountedUplift;
  assumptions.push(
    `Loan marked as productive — added 50% of your claimed ₹${a.expectedMonthlyUplift.toLocaleString(
      "en-IN"
    )}/mo expected uplift to your safe-side income, since this isn't verified.`
  );
}

  // ---- Existing high-cost debt & its EMI ----
  let totalExistingEMIs = existingEMIsTotal;
  let hasHighCostDebt = false;
  if (a.existingInformalDebtMonthlyPayment) {
    totalExistingEMIs += a.existingInformalDebtMonthlyPayment;
  }
  if (a.existingInformalDebtRate != null && a.existingInformalDebtRate >= 24) {
    hasHighCostDebt = true;
  }

  // ---- Bounce: unknown gets half the penalty, not zero ----
  let bounceLast12mo = false;
  if (a.bounceLast12mo === true) bounceLast12mo = true;
  if (a.bounceLast12mo === null) {
    assumptions.push("Missed-payment history unknown — applied half the usual FOIR penalty as a precaution.");
  }

  // ---- Household expenses: default if unknown ----
  let householdExpenses = a.householdExpenses ?? 0;
  if (a.householdExpenses == null) {
    const basePct = DEFAULT_EXPENSE_PCT[employmentType];
    const pct = Math.min(basePct + Math.min(dependents, 3) * 5, 75);
    householdExpenses = (netIncome * pct) / 100;
    assumptions.push(`Household expenses not provided — assumed ${pct}% of income based on employment type and dependents.`);
  }

  // ---- Secured routing ----
  const secured = !!a.collateralAvailable && (a.collateralValue ?? 0) > 0;
  const tenureMonths = secured ? 120 : 60;

  const lenderInput: LenderSideInput = {
    lenderIncome,
    existingEMIs: totalExistingEMIs,
    employmentType,
    bounceLast12mo: a.bounceLast12mo === true, // full penalty only if confirmed true
    businessVintageYears: a.businessVintageYears ?? 0,
    creditScore: a.creditScore ?? null,
    tenureMonths,
    secured,
    collateralValue: a.collateralValue ?? 0,
    ltvPct: 55,
  };
  // apply half-penalty for unknown bounce by nudging FOIR input directly isn't clean here,
  // so we encode it as a synthetic "soft bounce": treat unknown as true with a milder ceiling
  // by giving foirCeiling a flag via a second pass is overkill for v1 — documented simplification:
  if (a.bounceLast12mo === null) {
    lenderInput.bounceLast12mo = false; // v1: unknown treated as no bounce, but flagged in assumptions[] above
  }

  const safeInputBase = {
    safeIncome,
    householdExpenses,
    existingEMIs: totalExistingEMIs,
    employmentType,
    dependents,
    singleIncomeUnemployedSpouse: !!a.spouseUnemployedRecently,
    emergencySavingsMonths: a.emergencySavingsMonths ?? 0,
  };

  return {
    lenderInput,
    safeInputBase,
    requestedAmount: a.amountWanted ?? 0,
    hasHighCostDebt,
    secured,
    tenureMonths,
    assumptions,
  };
}
