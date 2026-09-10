import { Answers } from "./types";
import { deriveInputs } from "./deriveInputs";
import { lenderSanction } from "@/rules/rate";
import { safeCapacity } from "@/rules/safe";
import { verdict } from "@/rules/verdict";
import { computeAPR, emiForPrincipal } from "@/rules/apr";

function buildNegotiationCard(params: {
  verdict: ReturnType<typeof verdict>;
  lender: ReturnType<typeof lenderSanction>;
  safe: ReturnType<typeof safeCapacity>;
  safeStressed: ReturnType<typeof safeCapacity>;
  apr: number;
  hasHighCostDebt: boolean;
}): string[] {
  const { verdict: v, lender, safe, safeStressed, apr, hasHighCostDebt } = params;

  if (v.call === "DON'T BORROW") {
    const lines = [
      `Don't take this loan right now — ${v.why}.`,
    ];
    if (hasHighCostDebt) {
      lines.push(
        `Your existing debt is costing you more than any formal loan would (est. ${lender.rate.low}%–${lender.rate.high}% vs. what you're paying now). Focus on paying that down or consolidating it before taking on anything new.`
      );
    } else {
      lines.push(`Right now there's no monthly room left for a new EMI once your existing costs are covered — adding one would put you at risk of missing payments.`);
    }
    lines.push(
      `Revisit this in 3–6 months once you've gone that long without a missed payment and your existing debt load has come down — the numbers here will move once that's true.`
    );
    lines.push(`If a lender approves you anyway, that's their risk appetite, not a sign it's safe for you to take.`);
    return lines;
  }

  const lines = [
    `Verdict: ${v.call} — ${v.why}`,
    `Lender may sanction up to ₹${lender.amount.toLocaleString("en-IN")}; your safe ceiling is ₹${safe.principal.toLocaleString(
      "en-IN"
    )}. Use the safe number.`,
    `Fair rate for your profile: ${lender.rate.low}%–${lender.rate.high}% (all-in APR ≈ ${apr.toFixed(
      1
    )}%). If a lender quotes above this band, ask them to justify it against your profile.`,
    `Don't agree to an EMI above ₹${safe.safeEMI.toLocaleString("en-IN")}/mo — even under a 20% income drop, your safe EMI is ₹${safeStressed.safeEMI.toLocaleString(
      "en-IN"
    )}/mo.`,
  ];
  if (v.call === "BORROW LESS" && hasHighCostDebt) {
    lines.push(`Consider using part of this loan to close out your existing high-cost debt rather than taking both on at once.`);
  }
  return lines;
}

export interface CopilotResult {
  verdict: ReturnType<typeof verdict>;
  lender: ReturnType<typeof lenderSanction>;
  safe: ReturnType<typeof safeCapacity>;
  safeStressed: ReturnType<typeof safeCapacity>;
  apr: number;
  tenureOptions: { months: number; emi: number; withinSafe: boolean }[];
  requestedAmount: number;
  secured: boolean;
  assumptions: string[];
  negotiationCard: string[];
}

export function runCopilot(a: Answers): CopilotResult {
  const ctx = deriveInputs(a);
  const lender = lenderSanction(ctx.lenderInput);
  const midRate = (lender.rate.low + lender.rate.high) / 2;

  const safe = safeCapacity({ ...ctx.safeInputBase, tenureMonths: ctx.tenureMonths, midRate });
  const safeStressed = safeCapacity({
    ...ctx.safeInputBase,
    safeIncome: ctx.safeInputBase.safeIncome * 0.8,
    tenureMonths: ctx.tenureMonths,
    midRate,
  });

  const v = verdict({
    requestedAmount: ctx.requestedAmount,
    lenderAmount: lender.amount,
    safeAmount: safe.principal,
    safeEMI: safe.safeEMI,
    bounceLast12mo: ctx.lenderInput.bounceLast12mo,
    hasHighCostDebt: ctx.hasHighCostDebt,
  });

  const apr = ctx.requestedAmount > 0 ? computeAPR(ctx.requestedAmount, 2, midRate, ctx.tenureMonths) : 0;

  const tenureOptions = [36, 60, ctx.tenureMonths === 120 ? 120 : 84]
    .filter((m, i, arr) => arr.indexOf(m) === i)
    .map((m) => {
      const emi = Math.round(emiForPrincipal(ctx.requestedAmount, midRate, m));
      return { months: m, emi, withinSafe: emi <= safe.safeEMI };
    });

  const negotiationCard = buildNegotiationCard({ verdict: v, lender, safe, safeStressed, apr, hasHighCostDebt: ctx.hasHighCostDebt });

  return {
    verdict: v,
    lender,
    safe,
    safeStressed,
    apr,
    tenureOptions,
    requestedAmount: ctx.requestedAmount,
    secured: ctx.secured,
    assumptions: ctx.assumptions,
    negotiationCard,
  };
}
