# RULES.md — Borrower Copilot

Every threshold, band, and default used by the rules engine (`src/rules/`, `src/engine/`), with the reasoning behind it. Where a rule mirrors real Indian lending practice, the source is cited. Where it doesn't — the borrower-safe logic, most of it — it's marked "my judgement," because that gap between lender logic and borrower safety is the actual product.

## 1. Income: what counts, and for whom

The engine computes two different income figures per borrower — `lenderIncome` (what a lender would trust) and `safeIncome` (what's realistically available to the borrower) — because they diverge for anyone who isn't a salaried employee with a payslip.

| Rule | Value | Why | Source |
|---|---|---|---|
| Salaried, no variable pay | lenderIncome = safeIncome = declared net income | Payslip income is directly verifiable | — |
| Salaried, with variable pay | lenderIncome = fixed pay + 60% of variable pay | Bonus/incentive is real but not guaranteed month to month; discounting it (not zeroing it) avoids penalizing borrowers with legitimate variable comp | My judgement |
| Self-employed, ITR provided | lenderIncome = ITR annual income ÷ 12 | This is literally what a bank underwrites against — they don't see cash income | Standard lender practice |
| Self-employed, no ITR provided | lenderIncome = 50% of declared income | Conservative fallback when there's no verifiable document at all | My judgement |
| Self-employed, safe side | safeIncome = min(lenderIncome, borrower's own cash estimate) | The borrower's real cushion is whichever is *lower* — ITR often understates actual cash flow, but the borrower shouldn't plan around cash they can't reliably access either | My judgement |
| Informal, income range given | lenderIncome = midpoint of range × (0.80 if ≥2 income sources, else 0.75) | Multiple income streams reduce total volatility somewhat; the discount reflects that a range means real month-to-month uncertainty | My judgement |
| Informal, no range given | lenderIncome = declared income × 0.75 | Same volatility discount, applied to a point estimate when that's all we have | My judgement |
| Co-applicant / spouse income | Added in full to lenderIncome; added at 80% to safeIncome | Lenders count declared co-applicant income fully; the safe side discounts it slightly since it's a second, less-verified income stream | My judgement |
| Productive-loan uplift | If loan is marked productive and a monthly uplift is claimed: 50% of that uplift added to **safeIncome only**, never lenderIncome | A lender won't underwrite against unverified future revenue; a borrower is entitled to factor in *some* of it when judging their own affordability, but not the full claimed amount | My judgement |

## 2. FOIR (Fixed Obligation to Income Ratio) — the lender-side ceiling

FOIR measures existing obligations against income and is the primary tool Indian lenders use to gate eligibility. We use it for the *lender* number only — not the safe number, which uses independent logic (§4).

| Income tier | Salaried | Self-employed | Informal |
|---|---|---|---|
| < ₹50,000/mo | 40% | 35% | 30% |
| ₹50,000–1,50,000/mo | 50% | 45% | 40% |
| > ₹1,50,000/mo | 60% | 55% | 50% |

- **Base bands**: industry-typical — below 30% obligation load is considered excellent, 30–50% is the standard acceptable range, above 50% gets progressively riskier for a lender. We map that curve to three income tiers rather than a flat percentage, matching the real-world pattern that higher earners get more FOIR tolerance since a smaller share of their income is committed to survival costs. *(Source: general FOIR practice, e.g. Bajaj Finserv / IDFC First guidance on FOIR bands.)*
- **Self-employed and informal sit lower than salaried at the same income** by 5pp and 10pp respectively — unverifiable/volatile income gets a stricter ceiling even before any other adjustment. *(My judgement — not a published lender rule, but consistent with why unsecured self-employed/informal lending is generally tighter in practice.)*
- **−10 percentage points if a missed payment (bounce) occurred in the last 12 months.** A recent bounce is one of the strongest available signals of real repayment stress. *(My judgement on the exact size of the adjustment.)*
- **+5 percentage points for self-employed with ≥10 years business vintage.** Long survival is a meaningful stability proxy in the absence of ITR depth or a credit score. *(My judgement.)*

**Known limitation:** if the bounce question is answered "don't know" rather than a confirmed "No," the engine currently applies **no** penalty (treated as no-bounce), and instead surfaces this as a flagged assumption in the UI rather than a partial FOIR penalty. A more complete v2 would treat "unknown" as its own tri-state with a half-penalty; we chose not to fake that internally without a review of what a real "unknown bounce" penalty should be. **Unknown is flagged, not silently treated as "clean."**

## 3. Lender-side sanction amount (O2, lender figure)

```
affordableEMI = max(0, lenderIncome × FOIR% − existingEMIs)
principal_from_FOIR = present value of affordableEMI at the applicable rate, over the tenure
```

- **Unsecured products**: also compute `principal_from_multiplier = lenderIncome × multiplier`, where the multiplier is 20x/16x/12x/8x/6x for credit tiers 750+/700–749/650–699/<650/unknown. **Lender sanction = the lower of the two.** This mirrors real practice — banks compute both FOIR-based and multiplier-based eligibility and take the more conservative. *(Source: standard personal-loan eligibility methodology; multiplier range of 10–24x monthly income is the commonly cited industry range, we use the midpoint-weighted values above by tier.)*
- **Secured products** (collateral disclosed and valued): multiplier method doesn't apply; instead, `lender sanction = min(principal_from_FOIR, collateral value × 55% LTV)`. 55% is a conservative pick within the commonly cited 40–75% LTV range for loan-against-property, chosen because we have no independent valuation, only a self-reported estimate. *(Source: LAP LTV ranges cited by NBFC/bank comparison sources; 55% is our conservative choice within that range, not itself sourced.)*
- **Routing to secured vs. unsecured**: if the borrower discloses collateral with a nonzero value, the product is automatically routed to the secured path — this is a deliberate design choice, not something the borrower has to know to ask for. Unsecured tenure defaults to 60 months; secured defaults to 120 months, reflecting realistic product tenors.

## 4. Borrower-safe amount (O2, safe figure) — independent of §2/§3

This is the number without a bank equivalent — it exists because a lender's approval ceiling and a borrower's actual safety margin are different questions.

```
reserve% = 10% base
         + 5% per dependent (capped at 3 dependents, so max +15%)
         + 10% if income is self-employed or informal (volatility loading)
         + 5% if single-income household with a recently unemployed spouse/partner
         − 5% if ≥6 months of emergency savings are disclosed
         floor 5%, cap 35%

reserveAmount = safeIncome × reserve%
residualCapacity = safeIncome − householdExpenses − existingEMIs − reserveAmount

ratioCapEMI = (safeIncome × ratioCap%) − existingEMIs
  where ratioCap% = 35% salaried / 30% self-employed / 25% informal

safeEMI = max(0, min(residualCapacity, ratioCapEMI))
safeAmount = present value of safeEMI at the applicable rate, over the tenure
```

- **Reserve formula**: entirely our own construction — there's no bank equivalent since lenders don't optimize for the borrower's post-EMI quality of life. Every component is a judgement call, documented individually above. *(My judgement, in full.)*
- **The ratio-cap backstop exists specifically to catch the case where residual income alone would recommend an unrealistically high EMI** — e.g. a borrower with unusually low disclosed expenses relative to income. Whichever of the two calculations is more conservative wins; the UI shows which one bound (`bindingRule`).
- **Household expenses, if not disclosed**, default to a percentage of income by employment type — 30% salaried / 40% self-employed / 50% informal — plus 5% per dependent (capped at 3), capped overall at 75%. This default is **load-bearing**: for a low-income, high-dependent borrower, it can be the difference between a small positive safe capacity and zero. It is always flagged explicitly in the UI's "what this is guessing" list. *(My judgement — no external benchmark for this specific default.)*

## 5. Fair rate band and APR (O3)

| Credit tier | Rate band | Source |
|---|---|---|
| 750+ | 10.5%–12% | Commonly cited lender rate-by-CIBIL-tier tables |
| 700–749 | 12%–15% | Same |
| 650–699 | 15%–18% | Same |
| Below 650 | 18%–24% | Same |
| Unknown / no credit history | 17%–21% | My judgement — deliberately a distinct tier, not defaulted to the worst band. "Unknown is never zero" applies here: no score should not mean worst-case pricing, but it also shouldn't be assumed prime. |
| Secured (any tier) | 9%–13% | Collateral dominates pricing regardless of credit score; range reflects typical loan-against-property/business-loan bands from PSU/private-bank comparison sources |

- **APR** is computed as the actual annualized internal rate of return of the loan's cash flow — principal disbursed net of a processing fee, against the EMI schedule — not a flat "rate + fee" add-on. This mirrors what RBI's 2024 Key Facts Statement mandate requires regulated lenders to disclose: a computation sheet for APR alongside the full amortisation schedule, covering all charges. *(Source: RBI KFS circular, April 2024.)*
- **Processing fee assumed at 2%** of principal for the APR calculation — this is a placeholder representing a typical unsecured personal-loan processing fee, not tied to any specific lender's actual quote. *(My judgement / assumption — flagged as such.)*

## 6. EMI ceiling and stress test (O4)

- **O4's headline number is `safeEMI` from §4** — the borrower should not agree to an EMI above this, regardless of what a lender offers.
- **Tenure trade-off table**: the requested amount is shown at 36, 60, and either 84 (unsecured) or 120 (secured) months, each converted to an EMI at the applicable rate, each flagged against the safe EMI ceiling. This makes the tenure/EMI trade-off (lower EMI, more total interest, vs. higher EMI, less total interest) visible rather than implied.
- **Stress test**: safe capacity is recomputed with income reduced by a flat 20%, all other inputs (expenses, existing EMIs, reserve percentage) held fixed. This is deliberate — a borrower's fixed costs don't shrink when income drops, so the stress case shows how much of their margin is actually shock-absorbing versus how much evaporates immediately. For borrowers whose reserve is already near the 35% cap (multiple dependents, informal income, single-income household), this can show a very large relative drop in safe EMI even from a modest income shock — that's the rule working as intended, not a bug. *(My judgement — 20% is a standard illustrative stress magnitude, not derived from a specific benchmark.)*

## 7. The verdict (O1)

```
IF safeEMI <= 0
   OR (bounce in last 12mo AND existing debt at ≥24% APR)
   → DON'T BORROW

ELSE IF requestedAmount > safeAmount
   → BORROW LESS (counter-offer: safeAmount)

ELSE
   → BORROW
```

- **The ≥24% threshold for "high-cost debt"** is our own line — informal/app-loan debt above this rate is treated as a structural problem that a new loan shouldn't be layered on top of, rather than folded into ordinary FOIR math. *(My judgement.)*
- **DON'T BORROW deliberately overrides everything else**, including a nonzero lender sanction — a lender approving the loan is a statement about *their* risk appetite, not a statement that it's safe for the borrower, and the verdict logic reflects that directly.
- The Negotiation Card branches on this verdict: BORROW/BORROW LESS get the standard amount/rate/EMI card; DON'T BORROW replaces all of that with why not, what to fix first (consolidating existing high-cost debt where applicable), and when to revisit.

## 8. Question design and traceability

Full question set with the output(s) each one is designed to move is defined in `src/engine/questions.ts` (`affects` field per question) — this is the live source of truth rather than a duplicated table here, since duplicating it risks the two drifting apart. As a policy: **any question in that file whose `affects` array doesn't correspond to an actual branch in `deriveInputs.ts` or the rules functions is considered a bug**, not a future feature — the one case of this we found during development (`isProductiveLoan`/`expectedMonthlyUplift` being collected but unused) was fixed rather than left in.

## 9. Explicit limitations, stated rather than hidden

- The bounce-history "unknown" state is treated as no-bounce for calculation purposes (see §2) — a known simplification, not a considered design decision.
- The 2% processing fee used in APR is illustrative, not sourced from any real lender's current disclosed fee.
- LTV (55%) and self-employed-without-ITR (50% income haircut) are both conservative single-point choices within a real, wider industry range, chosen in the absence of an actual property valuation or bank-statement analysis.
- The stress test models a single, flat income shock. It does not model a rate-rise scenario, which would be equally valid and arguably more relevant for a floating-rate loan specifically — noted as a natural v2 addition.
- Mobile responsiveness has not yet been verified end-to-end at the time of writing.