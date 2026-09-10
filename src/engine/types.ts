import { EmploymentType } from "@/rules/types";

export interface Answers {
  [key: string]: unknown; 

  // Must questions (all personas answer these)
  purpose: string;
  amountWanted: number | null;
  employmentType: EmploymentType | null;
  netMonthlyIncome: number | null;
  existingEMIsTotal: number | null;
  bounceLast12mo: boolean | null;
  householdExpenses: number | null;
  age: number | null;
  creditScore: number | null;
  dependents: number | null;

  // Additional — salaried
  employerType?: "mnc_large" | "sme" | "govt_psu" | "startup";
  employmentTenureYears?: number;
  variablePayPct?: number;

  // Additional — self-employed
  itrAnnualIncome?: number;
  cashIncomeEstimate?: number;
  businessVintageYears?: number;
  collateralAvailable?: boolean;
  collateralValue?: number;

  // Additional — informal
  incomeRangeLow?: number;
  incomeRangeHigh?: number;
  incomeSources?: number;
  existingInformalDebtRate?: number;
  existingInformalDebtMonthlyPayment?: number;

  // Universal additional
  spouseOrPartnerIncome?: number;
  spouseUnemployedRecently?: boolean;
  emergencySavingsMonths?: number;
  isProductiveLoan?: boolean;
  expectedMonthlyUplift?: number;
}

export const emptyAnswers: Answers = {
  purpose: "",
  amountWanted: null,
  employmentType: null,
  netMonthlyIncome: null,
  existingEMIsTotal: null,
  bounceLast12mo: null,
  householdExpenses: null,
  age: null,
  creditScore: null,
  dependents: null,
};