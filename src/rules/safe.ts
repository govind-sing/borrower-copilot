import { SafeSideInput, SafeCapacityResult, ReserveResult, EmploymentType } from "./types";
import { principalForEmi } from "./apr";

export function safeReservePct(params: {
  dependents: number;
  employmentType: EmploymentType;
  singleIncomeUnemployedSpouse: boolean;
  emergencySavingsMonths: number;
}): ReserveResult {
  const { dependents, employmentType, singleIncomeUnemployedSpouse, emergencySavingsMonths } = params;
  const cappedDependents = Math.min(dependents, 3);
  let pct = 10 + cappedDependents * 5;
  const why: string[] = [`10% base + ${cappedDependents * 5}pp for ${cappedDependents} dependents`];

  if (employmentType !== "salaried") {
    pct += 10;
    why.push("+10pp income volatility (non-salaried)");
  }
  if (singleIncomeUnemployedSpouse) {
    pct += 5;
    why.push("+5pp single-income household, spouse unemployed");
  }
  if (emergencySavingsMonths >= 6) {
    pct -= 5;
    why.push("−5pp: ≥6 months emergency savings");
  }
  pct = Math.min(Math.max(pct, 5), 35);
  return { pct, why: why.join("; ") };
}

export function safeCapacity(p: SafeSideInput): SafeCapacityResult {
  const reserve = safeReservePct({
    dependents: p.dependents,
    employmentType: p.employmentType,
    singleIncomeUnemployedSpouse: p.singleIncomeUnemployedSpouse,
    emergencySavingsMonths: p.emergencySavingsMonths,
  });
  const reserveAmt = (p.safeIncome * reserve.pct) / 100;
  const residual = p.safeIncome - p.householdExpenses - p.existingEMIs - reserveAmt;

  const ratioCapPct: Record<EmploymentType, number> = {
    salaried: 35,
    self_employed: 30,
    informal: 25,
  };
  const ratioCapEmi = (p.safeIncome * ratioCapPct[p.employmentType]) / 100 - p.existingEMIs;

  const safeEMI = Math.max(0, Math.min(residual, ratioCapEmi));
  const bindingRule = residual <= ratioCapEmi ? "residual-income calc" : `${ratioCapPct[p.employmentType]}% ratio cap`;
  const principal = principalForEmi(safeEMI, p.midRate, p.tenureMonths);

  return {
    safeEMI: Math.round(safeEMI),
    principal: Math.round(principal),
    reserve,
    bindingRule,
  };
}