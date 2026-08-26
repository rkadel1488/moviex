import { MCQ_LIKE_TYPES } from "@/lib/constants";
import type { GeneratedQuestionPayload } from "@/lib/types";
import type { QuestionTypeRequest } from "@/lib/types";

export interface ValidationResult {
  score: number; // 0-1
  issues: string[];
}

/**
 * Deterministic quality checks (spec section 9) that don't require another
 * LLM call. Anything caught here is either fixed automatically (impossible
 * for most issues) or surfaced as a warning + score penalty so a human
 * reviewer sees it in the editor; scores below MIN_QUALITY_SCORE trigger a
 * top-up regeneration pass in the pipeline.
 */
export function validateQuestion(q: GeneratedQuestionPayload, request?: QuestionTypeRequest): ValidationResult {
  const issues: string[] = [];
  let score = 1;

  if (!q.questionText || q.questionText.trim().length < 5) {
    issues.push("Question text is missing or too short");
    score -= 0.5;
  }

  if (MCQ_LIKE_TYPES.includes(q.type)) {
    const options = q.options ?? [];
    const expectedCount = request?.optionCount ?? 4;
    if (options.length < 2) {
      issues.push("MCQ has fewer than 2 options");
      score -= 0.5;
    } else if (Math.abs(options.length - expectedCount) > 1) {
      issues.push(`Expected ~${expectedCount} options, got ${options.length}`);
      score -= 0.1;
    }
    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      issues.push(`MCQ must have exactly one correct option (found ${correctCount})`);
      score -= 0.4;
    }
    const texts = options.map((o) => o.text.trim().toLowerCase());
    if (new Set(texts).size !== texts.length) {
      issues.push("MCQ options are not all distinct");
      score -= 0.2;
    }
    if (options.some((o) => /all of the above|none of the above/i.test(o.text))) {
      issues.push('Avoid "All/None of the above" options');
      score -= 0.15;
    }
  }

  if (q.type === "MATCH_FOLLOWING") {
    const options = q.options ?? [];
    if (options.length < 2 || options.some((o) => !o.matchText)) {
      issues.push("Match-the-following pairs are incomplete");
      score -= 0.4;
    }
  }

  if (q.type === "FILL_BLANK" && !q.questionText.includes("___")) {
    issues.push("Fill-in-the-blank question does not contain a visible blank (____)");
    score -= 0.3;
  }

  if ((q.type === "CASE_BASED" || q.type === "CASE_BASED_MCQ") && !q.caseContext && !q.caseGroupKey) {
    issues.push("Case-based question is missing its case context/group");
    score -= 0.3;
  }

  if (!q.marks || q.marks <= 0) {
    issues.push("Marks must be a positive number");
    score -= 0.2;
  }

  return { score: Math.max(0, Math.min(1, score)), issues };
}
