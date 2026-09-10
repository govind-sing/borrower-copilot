import { Answers } from "./types";
import { QUESTIONS } from "./questions";

export type OutputId = "O1" | "O2" | "O3" | "O4";

// v1 heuristic: an output renders as "ink" once at least a third of the
// additional questions that affect it have been answered; otherwise "pencil".
export function confidenceFor(outputId: OutputId, answers: Answers): "ink" | "pencil" {
  const relevant = QUESTIONS.filter((q) => q.tier === "additional" && q.affects.includes(outputId));
  if (relevant.length === 0) return "ink";
  const answered = relevant.filter((q) => {
    const v = (answers as Record<string, unknown>)[q.id as string];
    return v !== null && v !== undefined && v !== "";
  });
  return answered.length / relevant.length >= 0.34 ? "ink" : "pencil";
}
