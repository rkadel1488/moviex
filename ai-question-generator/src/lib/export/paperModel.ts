import type { Prisma } from "@prisma/client";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";
import type { QuestionType } from "@/lib/constants";

export type PaperWithFullSections = Prisma.QuestionPaperGetPayload<{
  include: { sections: { include: { items: { include: { question: { include: { options: true } } } } } } };
}>;

export interface PaperMeta {
  schoolName?: string;
  examName?: string;
  academicSession?: string;
  subject?: string;
  grade?: string;
  date?: string;
  time?: string;
  fullMarks?: number;
  passMarks?: number;
  instructions?: string[];
}

export interface RenderedSectionItem {
  number: number;
  marks: number;
  isOptional: boolean;
  question: PaperWithFullSections["sections"][number]["items"][number]["question"];
}

export interface RenderedSection {
  title: string;
  instructions?: string | null;
  items: RenderedSectionItem[];
  marks: number;
}

export interface PaperContentModel {
  title: string;
  meta: PaperMeta;
  sections: RenderedSection[];
  totalMarks: number;
  totalQuestions: number;
}

export function buildPaperContentModel(paper: PaperWithFullSections): PaperContentModel {
  let counter = 0;
  const sections = [...paper.sections]
    .sort((a, b) => a.order - b.order)
    .map((section) => {
      const items: RenderedSectionItem[] = [...section.items]
        .sort((a, b) => a.order - b.order)
        .map((item) => {
          counter += 1;
          return {
            number: counter,
            marks: item.marksOverride ?? item.question.marks,
            isOptional: item.isOptional,
            question: item.question,
          };
        });
      return {
        title: section.title,
        instructions: section.instructions,
        items,
        marks: items.reduce((sum, i) => sum + i.marks, 0),
      };
    });

  return {
    title: paper.title,
    meta: (paper.meta ?? {}) as PaperMeta,
    sections,
    totalMarks: sections.reduce((sum, s) => sum + s.marks, 0),
    totalQuestions: counter,
  };
}

export function questionTypeLabel(type: string) {
  return QUESTION_TYPE_LABELS[type as QuestionType] ?? type;
}
