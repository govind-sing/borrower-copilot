import { Answers } from "./types";
import { EmploymentType } from "@/rules/types";

export type QuestionType = "text" | "number" | "boolean" | "select" | "range";

export interface Question {
  id: keyof Answers;
  tier: "must" | "additional";
  label: string;
  help?: string;
  type: QuestionType;
  options?: { value: string; label: string }[];
  appliesTo?: EmploymentType[]; // omit = applies to everyone
  affects: string[]; // which outputs this changes, for RULES.md traceability
}

export const QUESTIONS: Question[] = [
  // ---- MUST (order matters) ----
  { id: "purpose", tier: "must", label: "What is this loan for?", type: "text", affects: ["O1", "O3"] },
  { id: "amountWanted", tier: "must", label: "How much do you want to borrow (₹)?", type: "number", affects: ["O1", "O2"] },
  {
    id: "employmentType",
    tier: "must",
    label: "How would you describe your income?",
    type: "select",
    options: [
      { value: "salaried", label: "Salaried" },
      { value: "self_employed", label: "Self-employed / business (files ITR)" },
      { value: "informal", label: "Informal / gig / cash income" },
    ],
    affects: ["O1", "O2", "O3", "O4"],
  },
  { id: "netMonthlyIncome", tier: "must", label: "Net monthly income, all sources (₹)", type: "number", affects: ["O2", "O3", "O4"] },
  { id: "existingEMIsTotal", tier: "must", label: "Total of all existing EMIs per month (₹, 0 if none)", type: "number", affects: ["O2", "O4"] },
  {
    id: "bounceLast12mo",
    tier: "must",
    label: "Have you missed or delayed any EMI/bill payment in the last 12 months?",
    type: "boolean",
    affects: ["O1", "O2"],
  },
  {
    id: "householdExpenses",
    tier: "must",
    label: "Approximate monthly household/living expenses (₹) — skip if not sure",
    type: "number",
    affects: ["O2", "O4"],
  },
  { id: "age", tier: "must", label: "Your age", type: "number", affects: ["O2", "O4"] },
  {
    id: "creditScore",
    tier: "must",
    label: "Your credit score, if known (skip if you don't know or have no credit history)",
    type: "number",
    affects: ["O3"],
  },
  { id: "dependents", tier: "must", label: "Number of people financially dependent on you", type: "number", affects: ["O2", "O4"] },

  // ---- ADDITIONAL: salaried ----
  {
    id: "employerType",
    tier: "additional",
    label: "Type of employer",
    type: "select",
    options: [
      { value: "mnc_large", label: "Large company / MNC" },
      { value: "sme", label: "SME" },
      { value: "govt_psu", label: "Government / PSU" },
      { value: "startup", label: "Startup" },
    ],
    appliesTo: ["salaried"],
    affects: ["O3"],
  },
  { id: "employmentTenureYears", tier: "additional", label: "Years at current employer", type: "number", appliesTo: ["salaried"], affects: ["O2"] },
  { id: "variablePayPct", tier: "additional", label: "What % of your income is variable (bonus/incentive)?", type: "number", appliesTo: ["salaried"], affects: ["O2", "O4"] },

  // ---- ADDITIONAL: self-employed ----
  { id: "itrAnnualIncome", tier: "additional", label: "Annual income as per your last ITR (₹)", type: "number", appliesTo: ["self_employed"], affects: ["O2"] },
  { id: "cashIncomeEstimate", tier: "additional", label: "Your own estimate of actual monthly income (₹)", type: "number", appliesTo: ["self_employed"], affects: ["O2", "O4"] },
  { id: "businessVintageYears", tier: "additional", label: "Years running this business", type: "number", appliesTo: ["self_employed"], affects: ["O2"] },
  { id: "collateralAvailable", tier: "additional", label: "Do you have property or other collateral you could offer?", type: "boolean", appliesTo: ["self_employed"], affects: ["O2", "O3"] },
  { id: "collateralValue", tier: "additional", label: "Estimated value of that collateral (₹)", type: "number", appliesTo: ["self_employed"], affects: ["O2", "O3"] },

  // ---- ADDITIONAL: informal ----
  { id: "incomeRangeLow", tier: "additional", label: "Lowest typical monthly income (₹)", type: "number", appliesTo: ["informal"], affects: ["O2", "O4"] },
  { id: "incomeRangeHigh", tier: "additional", label: "Highest typical monthly income (₹)", type: "number", appliesTo: ["informal"], affects: ["O2", "O4"] },
  { id: "incomeSources", tier: "additional", label: "How many separate income sources do you have?", type: "number", appliesTo: ["informal"], affects: ["O2"] },
  { id: "existingInformalDebtRate", tier: "additional", label: "Interest rate on your existing loans, if any (% per year)", type: "number", appliesTo: ["informal"], affects: ["O1"] },
  { id: "existingInformalDebtMonthlyPayment", tier: "additional", label: "What do you currently pay monthly across all existing loans (₹)?", type: "number", appliesTo: ["informal"], affects: ["O1", "O2", "O4"] },

  // ---- ADDITIONAL: universal ----
  { id: "spouseOrPartnerIncome", tier: "additional", label: "Spouse/partner's monthly income, if any (₹)", type: "number", affects: ["O2", "O4"] },
  { id: "spouseUnemployedRecently", tier: "additional", label: "Has your spouse/partner been out of work recently?", type: "boolean", affects: ["O4"] },
  { id: "emergencySavingsMonths", tier: "additional", label: "Emergency savings, in months of expenses covered", type: "number", affects: ["O4"] },
  { id: "isProductiveLoan", tier: "additional", label: "Will this loan directly help you earn more (e.g. a vehicle, equipment, stock)?", type: "boolean", affects: ["O1"] },
  { id: "expectedMonthlyUplift", tier: "additional", label: "If yes — expected extra monthly income from it (₹)", type: "number", affects: ["O1"] },
];

export function questionsFor(employmentType: EmploymentType | null, tier: "must" | "additional"): Question[] {
  return QUESTIONS.filter((q) => q.tier === tier && (!q.appliesTo || (employmentType && q.appliesTo.includes(employmentType))));
}
