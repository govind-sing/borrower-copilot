# Walkthrough

## The problem this solves

Every lender has a model that decides what a borrower gets. The borrower usually has nothing — they walk in, take the first offer, and have no independent way to know if it's fair. Borrower Copilot isn't a credit model. It's a self-assessment that puts the borrower on equal footing before they negotiate anything, producing four things: whether they should borrow at all, how much (a lender's likely sanction *and* what's actually safe to carry — these are often different numbers), a fair rate band with an honest all-in APR, and an EMI ceiling with a stress test — plus a one-page Negotiation Card they can hold up in a branch.

## Walking through Ravi

Ravi is a kirana store owner in Mysuru, self-employed for 14 years, asking for ₹15 lakh for a second stock line and a delivery vehicle. He tells the app his ITR shows about ₹35,000/month, but he actually handles closer to ₹60,000 in cash. He owns his shop premises outright, worth about ₹45 lakh, and his wife earns ₹18,000 teaching.

Two things happen once he submits. First, because he's disclosed collateral, the app automatically routes him to a secured loan-against-property product instead of an unsecured personal loan — he doesn't have to know to ask for this. Second, his lender-eligible income is capped at his ITR figure, ₹35,000, not the ₹60,000 he actually earns, because a bank will never underwrite against cash it can't verify. That's a genuinely useful, slightly uncomfortable thing for a self-employed borrower to be told directly, and the app surfaces it rather than smoothing it over.

This produces the core gap the whole product is built around: a lender might sanction him close to ₹19 lakh, secured against his property. His actual safe capacity — what he can carry without real risk — comes out to about ₹11 lakh. He asked for ₹15 lakh. The verdict is **Borrow Less**, and the Negotiation Card tells him to counter at his safe number, not the lender's.

Every number here traces back to a documented rule. The 55% loan-to-value figure used for his collateral, for instance, is a deliberately conservative pick within the 40–75% range Indian lenders typically use for property-backed loans — chosen because we're working from a self-reported valuation, not an actual appraisal. Changing that number is a one-line edit in one rules file, since the rules are kept completely separate from the UI.

## Walking through Anita

Anita is a delivery rider in Hubballi — two children, a husband who's been out of work for eight months, three existing app loans at over 30% interest, and a missed payment last month. She wants ₹1.5 lakh for an electric scooter.

The verdict here is **Don't Borrow**, and it fires from two independent checks agreeing with each other rather than one calculation being forced to a conclusion: her FOIR is already breached before any new loan is even considered, and separately, her safe-capacity calculation — income minus expenses minus existing debt minus a safety reserve — lands on zero on its own.

The part of this build I'd point to as the actual product thinking, rather than just the calculation: the Negotiation Card doesn't print three zeroes at her. It explains why, and what to do next — pay down the existing high-cost debt first, come back in three to six months once she has a clean payment record, and if a lender approves her anyway regardless, that reflects their risk appetite, not a signal that it's safe for her.

## What I'd build next

- **A real tri-state for the "have you missed a payment" question.** Right now, "don't know" is treated the same as a confirmed "no" for the FOIR calculation, and only flagged as an assumption in the UI. A more complete version would apply a partial FOIR penalty to a genuinely unknown answer, rather than defaulting to the best case.
- **A rate-rise stress scenario alongside the income-drop one.** The current stress test only models a flat income cut; a borrower on a floating-rate loan is equally exposed to a rate increase, and that's an easy, well-justified addition using the same math already in place.
- **Verified income sources**, if this were to go further — bank statement analysis or GST returns for self-employed borrowers, rather than a self-reported cash estimate, would let the safe-side income calculation be a lot more precise instead of resting on a documented but still approximate discount.

## What I deliberately didn't build

Breadth of loan products. Home loans, gold loans, two-wheeler loans would all be straightforward to add using the same rules-separated-from-UI structure already in place, but none of the three personas needed them to prove the underlying reasoning holds up, and the brief is explicit that breadth beyond what the three borrowers need isn't part of what's being scored. I'd rather have three products working correctly and defensibly than six working shallowly.