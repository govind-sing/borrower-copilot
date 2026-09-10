import { VerdictResult } from "./types";

export function verdict(params: {
  requestedAmount: number;
  lenderAmount: number;
  safeAmount: number;
  safeEMI: number;
  bounceLast12mo: boolean;
  hasHighCostDebt: boolean;
}): VerdictResult {
  const { requestedAmount, lenderAmount, safeAmount, safeEMI, bounceLast12mo, hasHighCostDebt } = params;

  if (safeEMI <= 0 || (bounceLast12mo && hasHighCostDebt)) {
    return {
      call: "DON'T BORROW",
      why: "no safe monthly headroom left and/or existing high-cost debt plus a recent missed payment — a new EMI is not affordable right now",
    };
  }
  if (requestedAmount > safeAmount) {
    return {
      call: "BORROW LESS",
      why: `requested ₹${requestedAmount.toLocaleString("en-IN")} exceeds your safe capacity of ₹${safeAmount.toLocaleString(
        "en-IN"
      )}, even though a lender may sanction up to ₹${lenderAmount.toLocaleString("en-IN")}`,
    };
  }
  return {
    call: "BORROW",
    why: `requested amount is within your safe capacity of ₹${safeAmount.toLocaleString("en-IN")}`,
  };
}