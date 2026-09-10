# Borrower Copilot

A borrower's own pre-lender self-assessment. No login, no bureau pull, nothing stored — the borrower answers questions about their own situation and gets four things back: whether they should borrow at all, how much (a lender's likely sanction *and* what's actually safe — these are usually different), a fair interest rate band with an honest all-in APR, and an EMI ceiling with a stress test — plus a one-page Negotiation Card to take into a branch.

Built for the Lokta Borrower Copilot Build Challenge.

## Run it locally

Requires Node.js 18+.

```bash
git clone https://github.com/govind-sing/borrower-copilot
cd borrower-copilot
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables, no backend, no database — everything runs client-side in the browser.

## What's in this repo

| File | What it is |
|---|---|
| `RULES.md` | Every threshold, band, and default used by the engine, with the reasoning and source behind each one. Read this to understand *why* any number comes out the way it does. |
| `RUN_THROUGHS.md` | Priya, Ravi, and Anita run through the actual app — answers given, what the engine derived, the four outputs, and the resulting Negotiation Card for each. |
| `src/rules/` | Pure calculation functions — FOIR, multiplier method, CIBIL-tier rate bands, APR, safe-capacity, and the borrow/don't-borrow verdict. No UI code, no React, nothing here reads from a form. |
| `src/engine/` | The question set (`questions.ts`, with which output each question is designed to move), the logic that turns raw answers into what the rules functions need (`deriveInputs.ts`), the four-output orchestrator (`orchestrator.ts`), and the confidence/ink-vs-pencil signal (`confidence.ts`). |
| `src/components/` | Two small presentational components — an output line-entry and the Negotiation Card. |
| `src/app/` | The Next.js page, layout, fonts, and global styles. |

## Design approach

Rules are deliberately separated from the UI — every number and its justification lives in `src/rules/` or `src/engine/`, and the page in `src/app/page.tsx` only renders what those modules hand back. This was a specific choice so that changing a rule (e.g. in a live follow-up) means editing one function, not hunting through JSX.

The visual design is built around a passbook/ledger metaphor — the idea that this is the borrower's own record, not the bank's. One functional consequence of that: confidence is shown as a literal visual property (solid "ink" for a well-supported number, lighter "pencil" for one still resting on wide-band defaults) rather than as a separate caption or badge.

## Known limitations

See the "Explicit limitations" section at the end of `RULES.md` for the full list — notably: an unanswered "have you missed a payment" question is currently treated as no-bounce rather than a partial penalty, the processing fee used in the APR calculation (2%) is illustrative rather than sourced from a real lender quote, and the stress test models a flat income drop only, not a rate-rise scenario.