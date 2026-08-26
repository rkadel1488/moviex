import type { Question, QuestionOption } from "@prisma/client";
import { QUESTION_TYPE_LABELS, BLOOM_LEVEL_LABELS, DIFFICULTY_LABELS } from "@/lib/constants";
import type { BloomLevel, DifficultyLevel, QuestionType } from "@/lib/constants";
import { getAIProvider } from "./provider";
import { generatedQuestionSchema } from "./schema";
import type { GeneratedQuestionPayload } from "@/lib/types";

export const TRANSFORM_ACTIONS = [
  "REGENERATE",
  "REGENERATE_SIMILAR",
  "MAKE_EASIER",
  "MAKE_HARDER",
  "CONVERT_TYPE",
  "CHANGE_BLOOM",
  "GENERATE_EXPLANATION",
  "GENERATE_ANSWER",
] as const;
export type TransformAction = (typeof TRANSFORM_ACTIONS)[number];

export interface TransformParams {
  targetType?: QuestionType;
  targetBloomLevel?: BloomLevel;
  targetDifficulty?: DifficultyLevel;
  targetMarks?: number;
  instruction?: string; // free-text nudge, e.g. "suitable for Grade 5"
}

function describeOriginal(question: Question & { options: QuestionOption[] }) {
  const lines = [
    `Type: ${QUESTION_TYPE_LABELS[question.type as QuestionType] ?? question.type}`,
    `Question: ${question.questionText}`,
  ];
  if (question.caseContext) lines.push(`Case context: ${question.caseContext}`);
  if (question.options.length) {
    lines.push(
      "Options: " +
        question.options.map((o) => `${o.label}. ${o.text}${o.matchText ? ` -> ${o.matchText}` : ""}${o.isCorrect ? " (correct)" : ""}`).join(" | "),
    );
  }
  if (question.answerText) lines.push(`Answer: ${question.answerText}`);
  if (question.explanation) lines.push(`Explanation: ${question.explanation}`);
  lines.push(`Marks: ${question.marks}`);
  if (question.bloomLevel) lines.push(`Bloom level: ${BLOOM_LEVEL_LABELS[question.bloomLevel as BloomLevel] ?? question.bloomLevel}`);
  if (question.difficulty) lines.push(`Difficulty: ${DIFFICULTY_LABELS[question.difficulty as DifficultyLevel] ?? question.difficulty}`);
  return lines.join("\n");
}

function buildInstruction(action: TransformAction, params: TransformParams): string {
  switch (action) {
    case "REGENERATE":
      return "Rewrite this question from scratch on the same concept, type, marks and difficulty — produce a genuinely different question, not a paraphrase.";
    case "REGENERATE_SIMILAR":
      return "Produce a new question testing the same concept at the same type/difficulty/marks, similar in spirit but not a paraphrase.";
    case "MAKE_EASIER":
      return "Rewrite this as an easier version: reduce the number of reasoning steps, use simpler vocabulary, or ask for a more directly-stated fact. Lower the difficulty tag one level and keep the same type unless that's impossible.";
    case "MAKE_HARDER":
      return "Rewrite this as a harder version: require an extra reasoning step, a less direct connection to the source, or application to a new situation. Raise the difficulty tag one level.";
    case "CONVERT_TYPE":
      return `Convert this question into a ${params.targetType ? QUESTION_TYPE_LABELS[params.targetType] : "different"} question testing the same underlying concept. Follow the structural rules for that question type exactly (options for MCQ, pairs for match-the-following, a visible blank for fill-in-the-blank, a case passage for case-based).`;
    case "CHANGE_BLOOM":
      return `Rewrite this question so it targets Bloom's level "${params.targetBloomLevel ? BLOOM_LEVEL_LABELS[params.targetBloomLevel] : ""}" specifically — the cognitive demand (not just the wording) must match that level.`;
    case "GENERATE_EXPLANATION":
      return "Keep the question, options, and answer exactly as given. Only write a clear explanation of why the answer is correct.";
    case "GENERATE_ANSWER":
      return "Keep the question exactly as given. Only determine and write the correct answer (and options' correctness for MCQ/match types).";
    default:
      return "Improve this question while preserving its core concept.";
  }
}

export async function transformQuestion(
  question: Question & { options: QuestionOption[] },
  action: TransformAction,
  params: TransformParams = {},
): Promise<GeneratedQuestionPayload> {
  const targetMarks = params.targetMarks ?? question.marks;
  const system = [
    "You are editing a single existing exam question for a teacher.",
    "Preserve factual accuracy and keep the question answerable strictly from the same underlying source concept as the original.",
    "Return exactly one question via the emit_questions tool (an array with a single item).",
    "Follow the same MCQ, match-the-following, fill-in-the-blank, and case-based structural rules a fresh generation would follow: single correct MCQ answer, plausible distractors, no 'all/none of the above', visible ____ blanks, a real case passage for case-based types.",
  ].join("\n");

  const prompt = [
    "ORIGINAL QUESTION",
    describeOriginal(question),
    "",
    "REQUESTED CHANGE",
    buildInstruction(action, params),
    params.instruction ? `Additional instruction from the teacher: ${params.instruction}` : "",
    `Target marks: ${targetMarks}`,
  ]
    .filter(Boolean)
    .join("\n");

  const provider = getAIProvider();
  const result = await provider.generateStructured({ system, prompt, maxTokens: 3000 });
  const first = result.data.questions[0];
  const parsed = generatedQuestionSchema.safeParse(first);
  if (!parsed.success) {
    throw new Error("AI did not return a valid question for this edit");
  }
  return parsed.data;
}
