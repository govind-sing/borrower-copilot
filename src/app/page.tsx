"use client";

import { useMemo, useState } from "react";
import { Answers, emptyAnswers } from "@/engine/types";
import { QUESTIONS, Question } from "@/engine/questions";
import { runCopilot } from "@/engine/orchestrator";
import { confidenceFor } from "@/engine/confidence";
import { OutputEntry } from "@/components/OutputEntry";
import { NegotiationCard } from "@/components/NegotiationCard";
import { EmploymentType } from "@/rules/types";

function Field({
  q,
  value,
  onChange,
}: {
  q: Question;
  value: unknown;
  onChange: (id: string, value: unknown) => void;
}) {
  if (q.type === "boolean") {
    return (
      <div className="field">
        <label>{q.label}</label>
        <div className="field-bool">
          <button
            type="button"
            className={`pill ${value === true ? "active" : ""}`}
            onClick={() => onChange(q.id as string, true)}
          >
            Yes
          </button>
          <button
            type="button"
            className={`pill ${value === false ? "active" : ""}`}
            onClick={() => onChange(q.id as string, false)}
          >
            No
          </button>
          <button
            type="button"
            className={`pill ${value === null || value === undefined ? "active" : ""}`}
            onClick={() => onChange(q.id as string, null)}
          >
            Don't know
          </button>
        </div>
      </div>
    );
  }

  if (q.type === "select") {
    return (
      <div className="field">
        <label>{q.label}</label>
        <select value={(value as string) ?? ""} onChange={(e) => onChange(q.id as string, e.target.value || null)}>
          <option value="">— select —</option>
          {q.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="field">
      <label>{q.label}</label>
      <input
        type={q.type === "number" ? "number" : "text"}
        value={(value as string | number) ?? ""}
        placeholder="skip if not sure"
        onChange={(e) =>
          onChange(q.id as string, q.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)
        }
      />
    </div>
  );
}

export default function Home() {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [showResults, setShowResults] = useState(false);

  const employmentType = (answers.employmentType ?? null) as EmploymentType | null;

  const mustQuestions = useMemo(() => QUESTIONS.filter((q) => q.tier === "must"), []);
  const additionalQuestions = useMemo(
    () =>
      QUESTIONS.filter(
        (q) => q.tier === "additional" && (!q.appliesTo || (employmentType && q.appliesTo.includes(employmentType)))
      ),
    [employmentType]
  );

  function update(id: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setShowResults(false);
  }

  const canCalculate =
    answers.amountWanted != null &&
    answers.employmentType != null &&
    answers.netMonthlyIncome != null;

  const result = useMemo(() => (showResults ? runCopilot(answers) : null), [showResults, answers]);

  return (
    <main className="wrap">
      <h1>
        Borrower <em>Copilot</em>
      </h1>
      <p className="lede">Answer what you can. Skip what you don't know — the numbers will just stay wider until you don't.</p>

      <section>
        <h2>The essentials</h2>
        {mustQuestions.map((q) => (
          <Field key={q.id as string} q={q} value={(answers as Record<string, unknown>)[q.id as string]} onChange={update} />
        ))}
      </section>

      {employmentType && (
        <section className="ruled">
          <h2>Tighten your numbers</h2>
          <p className="lede" style={{ fontSize: "0.95rem", marginBottom: "1rem" }}>
            Optional — each of these narrows a specific range. Skip freely.
          </p>
          {additionalQuestions.map((q) => (
            <Field key={q.id as string} q={q} value={(answers as Record<string, unknown>)[q.id as string]} onChange={update} />
          ))}
        </section>
      )}

      <button className="calc-btn" disabled={!canCalculate} onClick={() => setShowResults(true)}>
        Open my passbook
      </button>

      {result && (
        <section className="ruled">
          <div className={`verdict-stamp ${result.verdict.call === "DON'T BORROW" ? "flag" : ""}`}>
            {result.verdict.call}
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: "0.9rem" }}>{result.verdict.why}</p>

          <OutputEntry
            serial="O2·L"
            label="A lender will likely sanction"
            figure={`₹${result.lender.amount.toLocaleString("en-IN")}`}
            why={result.lender.foir.why}
            confidence={confidenceFor("O2", answers)}
          />
          <OutputEntry
            serial="O2·S"
            label="You can safely carry"
            figure={`₹${result.safe.principal.toLocaleString("en-IN")}`}
            why={`${result.safe.bindingRule} · reserve ${result.safe.reserve.pct}%`}
            confidence={confidenceFor("O2", answers)}
          />
          <OutputEntry
            serial="O3"
            label="Fair rate for your profile"
            figure={`${result.lender.rate.low}%–${result.lender.rate.high}%`}
            why={`All-in APR at this amount ≈ ${result.apr.toFixed(1)}% · tier: ${result.lender.tier}${
              result.secured ? " · secured" : ""
            }`}
            confidence={confidenceFor("O3", answers)}
          />
          <OutputEntry
            serial="O4"
            label="Don't agree to an EMI above"
            figure={`₹${result.safe.safeEMI.toLocaleString("en-IN")}/mo`}
            why={`If income drops 20%, your safe EMI falls to ₹${result.safeStressed.safeEMI.toLocaleString("en-IN")}/mo`}
            confidence={confidenceFor("O4", answers)}
          />

          <NegotiationCard lines={result.negotiationCard} />

          {result.assumptions.length > 0 && (
            <details className="assumptions">
              <summary>What this is guessing ({result.assumptions.length})</summary>
              <ul>
                {result.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
    </main>
  );
}