import type { Prisma } from "@prisma/client";

type PaperWithSections = Prisma.QuestionPaperGetPayload<{
  include: { sections: { include: { items: { include: { question: true } } } } };
}>;

export interface PaperSectionSummary {
  id: string;
  title: string;
  questionCount: number;
  marks: number;
}

export interface PaperSummary {
  sections: PaperSectionSummary[];
  totalQuestions: number;
  totalMarks: number;
}

export function summarizePaper(paper: PaperWithSections): PaperSummary {
  const sections = [...paper.sections]
    .sort((a, b) => a.order - b.order)
    .map((section) => {
      const items = [...section.items].sort((a, b) => a.order - b.order);
      const marks = items.reduce((sum, item) => sum + (item.marksOverride ?? item.question.marks), 0);
      return { id: section.id, title: section.title, questionCount: items.length, marks };
    });

  return {
    sections,
    totalQuestions: sections.reduce((sum, s) => sum + s.questionCount, 0),
    totalMarks: sections.reduce((sum, s) => sum + s.marks, 0),
  };
}
