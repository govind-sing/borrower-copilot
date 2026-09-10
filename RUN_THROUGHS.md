# Run-throughs — Priya, Ravi, Anita

For each persona: the answers given (must + relevant additional questions), what the engine derived, the four outputs, and the resulting Negotiation Card. Figures below were produced by the actual app; where noted, the app confirmed the numbers we hand-validated during development.

---

## Priya, 29 — Bengaluru, salaried

**Wants:** ₹8,00,000 personal loan for a wedding.

### Answers given

| Question | Answer |
|---|---|
| Loan purpose | Wedding |
| Amount wanted | ₹8,00,000 |
| Income type | Salaried |
| Net monthly income | ₹1,10,000 |
| Existing EMIs total | ₹14,000 (car loan) |
| Missed payment in last 12 months | No |
| Household expenses | ₹28,000 |
| Age | 29 |
| Credit score | 780 |
| Dependents | 0 |

No additional (salaried) questions were answered — no employer type, tenure, or variable-pay % disclosed. This is deliberate for this run-through: it shows the app still producing a usable, correctly-narrow result on the must-questions alone for a well-documented borrower, rather than needing every optional field to be useful.

### What the engine derived

- Income type is salaried with no variable pay disclosed → lenderIncome = safeIncome = ₹1,10,000, no discount applied.
- Income tier ₹50k–1.5L → salaried FOIR ceiling 50%. No bounce, so no adjustment.
- Credit score 780 → top tier (750+) → rate band 10.5–12%, multiplier 20x.
- Reserve%: 10% base + 0 (no dependents) = 10%.
- Safe-side ratio cap for salaried: 35% of income.

### Outputs

| Output | Result |
|---|---|
| **O1 Verdict** | **BORROW** — requested amount is well within safe capacity |
| **O2 · Lender** | ₹18,74,000 (approx.) — FOIR-bound, not multiplier-bound |
| **O2 · Safe** | ₹11,20,000 (approx.) — binding rule: 35% ratio cap, not raw residual income |
| **O3 · Rate** | 10.5%–12%, all-in APR ≈ 12.9% at ₹8L |
| **O4 · Safe EMI** | ₹24,500/mo |
| **Tenure table (at ₹8L)** | 36 months → ₹26,300/mo, **exceeds safe range**; 60 months → ₹17,500/mo, within safe range |
| **Stress (income −20%)** | Safe EMI falls to ₹16,800/mo — the 5-year tenure option (₹17,500) sits just above this, worth flagging even though it clears the unstressed ceiling |

### Negotiation Card produced

> Verdict: BORROW — requested amount is within your safe capacity of ₹11,20,000.
> Lender may sanction up to ₹18,74,000; your safe ceiling is ₹11,20,000. Use the safe number.
> Fair rate for your profile: 10.5%–12% (all-in APR ≈ 12.9%). If a lender quotes above this band, ask them to justify it against your profile.
> Don't agree to an EMI above ₹24,500/mo — even under a 20% income drop, your safe EMI is ₹16,800/mo.

**What this run-through demonstrates:** a "clean" borrower still gets a real, non-trivial answer — the safe number is well above her ask, but the tenure table still catches that a shorter, faster-payoff loan would exceed her own safety ceiling even though the amount itself is fine. That's the kind of thing a borrower wouldn't otherwise think to check.

---

## Ravi, 42 — Mysuru, self-employed (kirana owner)

**Wants:** ₹15,00,000 for a second stock line and a delivery vehicle.

### Answers given

| Question | Answer |
|---|---|
| Loan purpose | Stock line and delivery vehicle |
| Amount wanted | ₹15,00,000 |
| Income type | Self-employed |
| Net monthly income | ₹60,000 (used as the cash-income estimate) |
| Existing EMIs total | ₹0 |
| Missed payment in last 12 months | No |
| Household expenses | ₹19,760 |
| Age | 42 |
| Credit score | *Don't know / no history* |
| Dependents | 0 |
| ITR annual income | ₹4,20,000 |
| Cash income estimate | ₹60,000/mo |
| Business vintage | 14 years |
| Collateral available | Yes |
| Collateral value | ₹45,00,000 (unencumbered shop premises) |
| Spouse/partner income | ₹18,000 |
| Productive loan | Yes |
| Expected monthly uplift | ₹8,000 |

### What the engine derived

- **lenderIncome** is capped at ITR/12 = ₹35,000/mo, *not* his declared ₹60,000 cash income — a lender only trusts what's documented. Plus spouse income in full → combined lender income ₹53,000/mo.
- **safeIncome** = min(ITR-based ₹35,000, cash estimate ₹60,000) = ₹35,000, plus 80% of spouse income (₹14,400) = ₹49,400/mo, plus 50% of the ₹8,000 productive-loan uplift (₹4,000) = **₹53,400/mo** for the safe-side calculation only.
- Collateral disclosed with nonzero value → routed to the **secured (loan-against-property) path** automatically. Multiplier method doesn't apply; LTV cap = 55% × ₹45,00,000 = ₹24,75,000.
- 14-year business vintage triggers the +5pp FOIR bonus for self-employed stability.
- No credit score, but secured routing overrides the credit-tier rate band entirely → 9–13%.
- Reserve%: 10% base + 10% (self-employed volatility) = 20% — no dependents, no unemployed spouse, no savings disclosed.

### Outputs

| Output | Result |
|---|---|
| **O1 Verdict** | **BORROW LESS** — ₹15L requested exceeds safe capacity, even though it's well under the lender ceiling |
| **O2 · Lender** | ₹19,20,000 (approx.) — LTV-capped, secured route |
| **O2 · Safe** | ₹10,80,000 (approx., pre-uplift) / ≈₹16,000/mo → higher safe EMI once the productive-loan uplift is included |
| **O3 · Rate** | 9%–13% (secured override) |
| **O4 · Safe EMI** | ≈₹16,000/mo (up from ₹14,820/mo before the productive-loan uplift was wired in) |

### Negotiation Card produced

> Verdict: BORROW LESS — requested ₹15,00,000 exceeds your safe capacity, even though a lender may sanction up to ₹19,20,000.
> Lender may sanction up to ₹19,20,000; your safe ceiling is lower. Use the safe number.
> Fair rate for your profile: 9%–13% — this only applies because you have collateral to offer; without it, as a self-employed borrower with no credit history, you'd likely be quoted 17–21% or worse on an unsecured product.
> Don't agree to an EMI above your safe ceiling, even though a lender would let you borrow more.

**What this run-through demonstrates:** the single biggest thing this product can do for a self-employed borrower — routing him to a secured product he might not have thought to ask for, and showing that his *real* eligibility is capped by what his ITR shows, not what he actually earns. The gap between ₹19.2L (lender) and ~₹11L (safe) is the entire point of having two separate numbers.

---

## Anita, 35 — Hubballi, informal/gig

**Wants:** ₹1,50,000 for an electric scooter to double delivery runs.

### Answers given

| Question | Answer |
|---|---|
| Loan purpose | Electric scooter for delivery work |
| Amount wanted | ₹1,50,000 |
| Income type | Informal / gig / cash income |
| Net monthly income | ₹28,000 |
| Existing EMIs total | ₹0 (formal) |
| Missed payment in last 12 months | **Yes** |
| Household expenses | *Not provided — default applied* |
| Age | 35 |
| Credit score | *Don't know* |
| Dependents | 2 |
| Lowest typical monthly income | ₹26,000 |
| Highest typical monthly income | ₹30,000 |
| Income sources | 2 |
| Interest rate on existing loans | 30% |
| Current monthly payment on existing loans | ₹5,250 |
| Spouse/partner income | *not provided* |
| Spouse unemployed recently | **Yes** |
| Productive loan | Yes |
| Expected monthly uplift | *provided, does not affect result — see note* |

### What the engine derived

- Income = midpoint of ₹26k–30k range (₹28,000) × 0.80 (2 income sources) = ₹22,400/mo for both lender and safe sides.
- Household expenses not given → default applied: 50% (informal) + 10% (2 dependents, capped) = 60% of income ≈ ₹16,800/mo — **this default is load-bearing for her result**, flagged explicitly in the app's "what this is guessing."
- Informal FOIR ceiling at this income tier: 30%, minus 10pp for the confirmed bounce → **20%**.
- `affordableEMI_lender = 22,400 × 0.20 − 5,250 (existing debt) = −810` → floored to ₹0.
- Reserve%: 10% base + 10% (2 dependents) + 10% (informal volatility) + 5% (single-income, spouse recently unemployed) = 35%, capped.
- Residual capacity: 22,400 − 16,800 − 5,250 − (0.35 × 22,400) ≈ deeply negative → floored to ₹0.
- Existing debt at 30% clears the ≥24% "high-cost debt" threshold, and a bounce is confirmed → the hard DON'T BORROW trigger fires on **two independent conditions at once**.
- The productive-loan uplift (50% of claimed revenue) never gets a chance to matter, because safe capacity is already zero before it would apply — correctly, since an unverified revenue claim shouldn't be able to override existing structural over-indebtedness.

### Outputs

| Output | Result |
|---|---|
| **O1 Verdict** | **DON'T BORROW** |
| **O2 · Lender** | ₹0 |
| **O2 · Safe** | ₹0 |
| **O3 · Rate** | 17%–21% (unknown-tier band; shown for context even though the verdict is don't-borrow) |
| **O4 · Safe EMI** | ₹0/mo |

### Negotiation Card produced

> Don't take this loan right now — no safe monthly headroom left and existing high-cost debt plus a recent missed payment make a new EMI unaffordable.
> Your existing debt is costing you more than any formal loan would (est. 17%–21% vs. what you're paying now). Focus on paying that down or consolidating it before taking on anything new.
> Revisit this in 3–6 months once you've gone that long without a missed payment and your existing debt load has come down — the numbers here will move once that's true.
> If a lender approves you anyway, that's their risk appetite, not a sign it's safe for you to take.

**What this run-through demonstrates:** the app's willingness to say "don't," backed by two independent hard triggers (FOIR breach and existing high-cost debt + bounce) rather than one calculation forcing the answer. It also shows the Negotiation Card correctly abandoning the amount/rate/EMI format entirely once the verdict is negative — a borrower in this position needs a plan, not a ceiling of ₹0.