export interface ApiOption {
  id: string;
  label: string;
  text: string;
  matchText?: string | null;
  isCorrect: boolean;
  order: number;
}

export interface ApiQuestion {
  id: string;
  type: string;
  questionText: string;
  caseContext?: string | null;
  caseGroupId?: string | null;
  answerText?: string | null;
  explanation?: string | null;
  marks: number;
  bloomLevel?: string | null;
  difficulty?: string | null;
  wordBank?: string[] | null;
  markingScheme?: { criterion: string; marks: number }[] | null;
  rubric?: { criteria: { name: string; levels: { score: number; label: string; description: string }[] }[] } | null;
  sourceRef?: { chunkId?: string; page?: number; section?: string; paragraph?: number } | null;
  qualityScore?: number | null;
  qualityIssues?: string[] | null;
  isFavorite: boolean;
  tags?: string[] | null;
  options: ApiOption[];
  createdAt?: string;
}
