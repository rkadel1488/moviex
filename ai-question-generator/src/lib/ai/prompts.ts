import { BLOOM_LEVEL_LABELS, DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from "@/lib/constants";
import type { GenerationConfig } from "@/lib/types";
import type { RetrievedChunk } from "@/lib/types";

/**
 * The system prompt is the single place that encodes the product's
 * pedagogical and quality rules (spec sections 8, 9, 10, 11, 12, 13, 36).
 * It is intentionally strict and repetitive on the source-grounding rule
 * since that is the most consequential failure mode (fabricated facts).
 */
export function buildSystemPrompt(config: GenerationConfig): string {
  const rules: string[] = [
    "You are an expert assessment writer and curriculum designer generating exam-quality questions for teachers.",
    `Target audience: ${config.grade}${config.board ? ` (${config.board} curriculum)` : ""}, subject: ${config.subject}.`,
    "Write in a register and vocabulary appropriate for that grade level. Do not use language that is too advanced or too simplistic for the stated grade.",
    "",
    "SOURCE GROUNDING",
    "- You will be given numbered source excerpts, each tagged with a chunkId and (when known) page/section.",
    config.sourceOnly
      ? "- SOURCE-ONLY MODE IS ON: every question and its answer must be fully supported by the provided excerpts. Never introduce facts, figures, names, or examples that are not present in the excerpts. If the excerpts do not contain enough material to write a requested question, write fewer questions rather than inventing content."
      : "- You may supplement the excerpts with well-established general knowledge when it helps write a better question, but prefer the excerpts as the primary basis and never contradict them.",
    "- For every question, set sourceRef to the chunkId (and page/section if available) of the excerpt(s) the question is drawn from.",
    "",
    "QUALITY RULES",
    "- Never write filler or trivial questions just to reach a requested count; it is acceptable to return fewer questions than requested if the source material cannot support more without repetition.",
    "- No duplicate or near-duplicate questions — do not ask the same fact two different ways.",
    "- Questions must assess understanding, not simply ask the reader to recite a sentence copied from the source.",
    "- Every question must have exactly one unambiguous correct answer, unless it explicitly allows multiple correct answers.",
    "- Difficulty must come from cognitive demand (reasoning steps, abstraction, unfamiliarity of context), not from longer or more convoluted wording.",
    "- Application-based questions must require using a concept in a new situation not stated verbatim in the source.",
    "- Analytical/HOTS questions must require comparison, inference, cause-effect reasoning, or evaluation — not recall.",
    "",
    "MULTIPLE CHOICE RULES (for MCQ_SINGLE and CASE_BASED_MCQ)",
    "- Provide the requested number of options (default 4, labeled A, B, C, ...).",
    "- Exactly one option must have isCorrect: true.",
    "- Distractors must be plausible and related to the concept, reflecting realistic misconceptions — never obviously wrong, never overlapping in meaning, and never grammatically mismatched with the stem in a way that reveals the answer.",
    "- Do not use 'All of the above' or 'None of the above' options.",
    "",
    "MATCH THE FOLLOWING",
    "- Provide options as pairs: `text` is the Column A item, `matchText` is its correct Column B match. Keep columns clean and unambiguous — each Column A item must match exactly one Column B item.",
    "",
    "FILL IN THE BLANKS",
    "- The blank must test an important term, fact, formula, or relationship — never a random word. Mark the blank in questionText using ____. Put the correct filler in answerText. If a word bank is requested, include distractor terms in wordBank.",
    "",
    "CASE-BASED QUESTIONS (CASE_BASED, CASE_BASED_MCQ)",
    "- First write a realistic, self-contained case/passage/scenario (150-300 words) grounded in the source material, in caseContext.",
    "- Give every sub-question of that case the same caseGroupKey, and repeat the identical caseContext text on each of them.",
    "- Sub-questions must require understanding of both the case and the underlying concept, not just fact lookup from the passage.",
    "",
    "BLOOM'S TAXONOMY & DIFFICULTY",
    "- Tag every question with the bloomLevel and difficulty that best matches its actual cognitive demand — do not default to the same level for every question.",
  ];

  if (!config.includeAnswers) rules.push("- Do not include answerText.");
  if (!config.includeExplanations) rules.push("- Do not include explanation.");
  if (config.includeMarkingScheme) {
    rules.push("- For short/long/case subjective questions, include markingScheme as a point-wise mark breakdown that sums to the question's marks.");
  }
  if (config.includeRubric) {
    rules.push("- For open-ended/HOTS/application questions, include a rubric with 3-5 criteria and score levels.");
  }

  rules.push(
    "",
    "OUTPUT",
    "Call the emit_questions tool exactly once with every generated question. Do not include commentary outside the tool call.",
  );

  return rules.join("\n");
}

export function buildUserPrompt(
  config: GenerationConfig,
  chunks: RetrievedChunk[],
  recentQuestionTexts: string[],
): string {
  const sections: string[] = [];

  sections.push("SOURCE EXCERPTS");
  if (chunks.length === 0) {
    sections.push("(No source document provided — generate from the topic/learning outcome description below only.)");
  } else {
    for (const chunk of chunks) {
      const tags = [chunk.section, chunk.page ? `page ${chunk.page}` : null].filter(Boolean).join(", ");
      sections.push(`[chunkId=${chunk.id}${tags ? ` | ${tags}` : ""}]\n${chunk.content}`);
    }
  }

  sections.push("", "ASSIGNMENT DETAILS");
  sections.push(`Subject: ${config.subject}`);
  sections.push(`Grade/Level: ${config.grade}`);
  if (config.board) sections.push(`Curriculum/Board: ${config.board}`);
  if (config.chapter) sections.push(`Chapter: ${config.chapter}`);
  if (config.topic) sections.push(`Topic: ${config.topic}`);
  if (config.subtopic) sections.push(`Subtopic: ${config.subtopic}`);
  sections.push(`Language: generate all question/answer text in "${config.language}"`);
  if (config.learningOutcomes?.length) {
    sections.push(`Learning outcomes to cover: ${config.learningOutcomes.join("; ")}`);
  }
  if (config.competency) sections.push(`Competency focus: ${config.competency}`);
  if (config.questionLength) sections.push(`Question length: ${config.questionLength}`);
  if (config.answerLength) sections.push(`Answer length: ${config.answerLength}`);

  sections.push("", "QUESTIONS TO GENERATE (exact type + count + marks each)");
  for (const req of config.questionTypes) {
    const label = QUESTION_TYPE_LABELS[req.type];
    const details: string[] = [`${req.count} x ${label}`, `${req.marksEach} mark(s) each`];
    if (req.optionCount) details.push(`${req.optionCount} options`);
    if (req.type === "FILL_BLANK") {
      details.push(req.useWordBank ? "include a word bank" : "no word bank");
      if (req.blanksPerQuestion && req.blanksPerQuestion > 1) details.push(`${req.blanksPerQuestion} blanks per question`);
    }
    if (req.case?.subQuestionTypes?.length) {
      details.push(`sub-questions: ${req.case.subQuestionTypes.map((t) => QUESTION_TYPE_LABELS[t]).join(", ")}`);
    }
    sections.push(`- ${details.join(", ")}`);
  }
  if (config.numberOfCases && config.questionsPerCase) {
    sections.push(`Case-based generation: ${config.numberOfCases} case(s), ${config.questionsPerCase} question(s) per case.`);
  }

  sections.push("", "DIFFICULTY");
  if (config.difficulty === "AUTO_BALANCED" || config.difficulty === "MIXED") {
    const dist = config.difficultyDistribution;
    sections.push(
      dist
        ? `Balance difficulty across the batch approximately: ${Object.entries(dist)
            .map(([k, v]) => `${DIFFICULTY_LABELS[k as keyof typeof DIFFICULTY_LABELS]} ${v}%`)
            .join(", ")}.`
        : "Balance difficulty naturally across Easy, Moderate, and Difficult.",
    );
  } else {
    sections.push(`All questions should be ${DIFFICULTY_LABELS[config.difficulty]} difficulty.`);
  }

  sections.push("", "BLOOM'S TAXONOMY");
  if (config.bloomLevels === "AUTO_BALANCED") {
    const dist = config.bloomDistribution;
    sections.push(
      dist
        ? `Distribute Bloom levels approximately: ${Object.entries(dist)
            .map(([k, v]) => `${BLOOM_LEVEL_LABELS[k as keyof typeof BLOOM_LEVEL_LABELS]} ${v}%`)
            .join(", ")}.`
        : "Distribute questions across all six Bloom levels in a balanced way.",
    );
  } else {
    sections.push(`Only use these Bloom levels: ${config.bloomLevels.map((l) => BLOOM_LEVEL_LABELS[l]).join(", ")}.`);
  }

  if (config.avoidDuplicates && recentQuestionTexts.length > 0) {
    sections.push(
      "",
      "AVOID REPEATING THESE ALREADY-GENERATED QUESTIONS (do not ask the same thing again, even reworded):",
      ...recentQuestionTexts.slice(0, 40).map((q) => `- ${q}`),
    );
  }

  return sections.join("\n");
}
