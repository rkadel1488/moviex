import type { BloomLevel, DifficultyLevel, QuestionType } from "./constants";

/** One entry of "generate N questions of this type". */
export interface QuestionTypeRequest {
  type: QuestionType;
  count: number;
  marksEach: number;
  /** Only for CASE_BASED / CASE_BASED_MCQ groups. */
  case?: {
    subQuestionTypes: QuestionType[];
  };
  /** Only for MCQ-like types. */
  optionCount?: number; // 3-6, default 4
  /** Only for FILL_BLANK. */
  blanksPerQuestion?: number;
  useWordBank?: boolean;
}

/** Full configuration panel state (Section 6 of the spec). */
export interface GenerationConfig {
  subject: string;
  grade: string;
  board?: string;
  chapter?: string;
  topic?: string;
  subtopic?: string;
  language: string; // ISO code, see LANGUAGES

  questionTypes: QuestionTypeRequest[];
  totalQuestions: number;
  totalMarks?: number;

  difficulty: "AUTO_BALANCED" | "MIXED" | DifficultyLevel;
  difficultyDistribution?: Partial<Record<DifficultyLevel, number>>; // percentages

  bloomLevels: BloomLevel[] | "AUTO_BALANCED";
  bloomDistribution?: Partial<Record<BloomLevel, number>>; // percentages

  learningOutcomes?: string[]; // free text, e.g. ["LO1: Explain photosynthesis"]
  competency?: string;

  questionLength?: "BRIEF" | "STANDARD" | "DETAILED";
  answerLength?: "BRIEF" | "STANDARD" | "DETAILED";

  includeAnswers: boolean;
  includeExplanations: boolean;
  includeMarkingScheme: boolean;
  includeRubric: boolean;

  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  avoidDuplicates: boolean;
  sourceOnly: boolean;

  numberOfCases?: number; // for pure case-based generation
  questionsPerCase?: number;
}

/** Structured shape the LLM must return for one generated question. */
export interface GeneratedQuestionPayload {
  type: QuestionType;
  questionText: string;
  caseContext?: string; // shared passage text, only present on the first item of a case group
  caseGroupKey?: string; // links sub-questions of the same case together within one response
  options?: {
    label: string;
    text: string;
    matchText?: string;
    isCorrect: boolean;
  }[];
  wordBank?: string[];
  answerText?: string;
  explanation?: string;
  markingScheme?: { criterion: string; marks: number }[];
  rubric?: {
    criteria: { name: string; levels: { score: number; label: string; description: string }[] }[];
  };
  bloomLevel?: BloomLevel;
  difficulty?: DifficultyLevel;
  marks: number;
  sourceRef?: { page?: number; paragraph?: number; section?: string; chunkId?: string };
}

export interface RetrievedChunk {
  id: string;
  content: string;
  heading?: string | null;
  section?: string | null;
  page?: number | null;
}
