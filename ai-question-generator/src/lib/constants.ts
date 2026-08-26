// Central vocabulary for the app. Kept as plain string const-arrays (not DB
// enums) so curricula/question types stay extensible without a migration —
// see the note at the top of prisma/schema.prisma.

export const QUESTION_TYPES = [
  "MCQ_SINGLE",
  "TRUE_FALSE",
  "FILL_BLANK",
  "MATCH_FOLLOWING",
  "VERY_SHORT_ANSWER",
  "SHORT_ANSWER",
  "LONG_ANSWER",
  "QUESTION_ANSWER",
  "APPLICATION_BASED",
  "HOTS",
  "CASE_BASED",
  "CASE_BASED_MCQ",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MCQ_SINGLE: "Multiple Choice (Single Correct)",
  TRUE_FALSE: "True / False",
  FILL_BLANK: "Fill in the Blanks",
  MATCH_FOLLOWING: "Match the Following",
  VERY_SHORT_ANSWER: "Very Short Answer",
  SHORT_ANSWER: "Short Answer",
  LONG_ANSWER: "Long Answer",
  QUESTION_ANSWER: "Question–Answer",
  APPLICATION_BASED: "Application-Based",
  HOTS: "HOTS / Critical Thinking",
  CASE_BASED: "Case-Based (Subjective)",
  CASE_BASED_MCQ: "Case-Based MCQ",
};

// Question types that generate as a group under a shared case/passage.
export const CASE_QUESTION_TYPES: QuestionType[] = ["CASE_BASED", "CASE_BASED_MCQ"];
// Question types that need an options list.
export const MCQ_LIKE_TYPES: QuestionType[] = ["MCQ_SINGLE", "CASE_BASED_MCQ"];

export const BLOOM_LEVELS = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"] as const;
export type BloomLevel = (typeof BLOOM_LEVELS)[number];

export const BLOOM_LEVEL_LABELS: Record<BloomLevel, string> = {
  REMEMBER: "Remember",
  UNDERSTAND: "Understand",
  APPLY: "Apply",
  ANALYZE: "Analyze",
  EVALUATE: "Evaluate",
  CREATE: "Create",
};

export const DEFAULT_BLOOM_DISTRIBUTION: Record<BloomLevel, number> = {
  REMEMBER: 20,
  UNDERSTAND: 20,
  APPLY: 25,
  ANALYZE: 20,
  EVALUATE: 10,
  CREATE: 5,
};

export const DIFFICULTY_LEVELS = ["VERY_EASY", "EASY", "MODERATE", "DIFFICULT", "VERY_DIFFICULT"] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  VERY_EASY: "Very Easy",
  EASY: "Easy",
  MODERATE: "Moderate",
  DIFFICULT: "Difficult",
  VERY_DIFFICULT: "Very Difficult",
};

export const DEFAULT_DIFFICULTY_DISTRIBUTION: Record<DifficultyLevel, number> = {
  VERY_EASY: 5,
  EASY: 25,
  MODERATE: 45,
  DIFFICULT: 20,
  VERY_DIFFICULT: 5,
};

export const CURRICULUM_PRESETS = [
  "CBSE",
  "ICSE",
  "NEB Nepal",
  "CDC Nepal",
  "Cambridge",
  "IB",
  "State Board",
  "University",
  "Custom",
] as const;

export const GRADE_PRESETS = [
  "Preschool",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "College",
  "University",
  "Professional Training",
] as const;

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ne", label: "Nepali" },
  { code: "hi", label: "Hindi" },
] as const;

export const DOCUMENT_SOURCE_TYPES = ["TEXT", "PDF", "DOCX", "TOPIC"] as const;
export type DocumentSourceType = (typeof DOCUMENT_SOURCE_TYPES)[number];

export const PAPER_TEMPLATES = [
  "SCHOOL_EXAM",
  "CBSE_STYLE",
  "NEB_STYLE",
  "UNIVERSITY_STYLE",
  "WORKSHEET",
  "PRACTICE_SHEET",
  "QUIZ",
  "HOMEWORK",
  "ASSIGNMENT",
  "REVISION_SHEET",
] as const;
export type PaperTemplate = (typeof PAPER_TEMPLATES)[number];

export const PAPER_TEMPLATE_LABELS: Record<PaperTemplate, string> = {
  SCHOOL_EXAM: "School Exam",
  CBSE_STYLE: "CBSE Style",
  NEB_STYLE: "NEB Style",
  UNIVERSITY_STYLE: "University Style",
  WORKSHEET: "Worksheet",
  PRACTICE_SHEET: "Practice Sheet",
  QUIZ: "Quiz",
  HOMEWORK: "Homework",
  ASSIGNMENT: "Assignment",
  REVISION_SHEET: "Revision Sheet",
};

export const USER_ROLES = [
  "ADMIN",
  "SCHOOL_ADMIN",
  "TEACHER",
  "STUDENT",
  "CONTENT_CREATOR",
  "EXAM_COORDINATOR",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MIN_QUALITY_SCORE = 0.55;
export const MAX_GENERATION_ATTEMPTS_PER_BATCH = 2;
