import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import type { PaperContentModel, RenderedSectionItem } from "./paperModel";
import { MCQ_LIKE_TYPES } from "@/lib/constants";

function questionParagraphs(item: RenderedSectionItem): Paragraph[] {
  const q = item.question;
  const paragraphs: Paragraph[] = [];

  if (q.caseContext) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: q.caseContext, italics: true })], spacing: { after: 100 } }));
  }

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Q${item.number}. `, bold: true }),
        new TextRun({ text: q.questionText }),
        new TextRun({ text: `  [${item.marks}]`, italics: true }),
      ],
      spacing: { after: 60 },
    }),
  );

  if (q.type === "MATCH_FOLLOWING") {
    q.options.forEach((o, i) => {
      paragraphs.push(
        new Paragraph({ text: `   ${i + 1}. ${o.text}      ${String.fromCharCode(97 + i)}. ${o.matchText}`, spacing: { after: 20 } }),
      );
    });
  } else if (q.options.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: q.options.map((o) => `${o.label}. ${o.text}`).join("      ") })],
        spacing: { after: 100 },
      }),
    );
  }

  if (Array.isArray(q.wordBank) && q.wordBank.length > 0) {
    paragraphs.push(new Paragraph({ text: `Word bank: ${(q.wordBank as string[]).join(", ")}`, spacing: { after: 100 } }));
  }

  return paragraphs;
}

export async function buildPaperDocx(paper: PaperContentModel): Promise<Buffer> {
  const { meta } = paper;
  const children: Paragraph[] = [];

  if (meta.schoolName) {
    children.push(new Paragraph({ text: meta.schoolName, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }));
  }
  children.push(
    new Paragraph({ text: meta.examName || paper.title, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }),
  );
  children.push(
    new Paragraph({
      text: `Subject: ${meta.subject ?? ""}    Grade: ${meta.grade ?? ""}    Date: ${meta.date ?? ""}`,
    }),
  );
  children.push(
    new Paragraph({
      text: `Time: ${meta.time ?? ""}    Full Marks: ${meta.fullMarks ?? paper.totalMarks}    Pass Marks: ${meta.passMarks ?? ""}`,
      spacing: { after: 200 },
    }),
  );

  if (meta.instructions && meta.instructions.length > 0) {
    children.push(new Paragraph({ text: "General Instructions", heading: HeadingLevel.HEADING_3 }));
    meta.instructions.forEach((line, i) => children.push(new Paragraph({ text: `${i + 1}. ${line}` })));
  }

  for (const section of paper.sections) {
    children.push(
      new Paragraph({
        text: `${section.title}  (${section.items.length} x — ${section.marks} marks)`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
      }),
    );
    if (section.instructions) {
      children.push(new Paragraph({ children: [new TextRun({ text: section.instructions, italics: true })], spacing: { after: 100 } }));
    }
    for (const item of section.items) {
      children.push(...questionParagraphs(item));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

function answerSummary(item: RenderedSectionItem): string {
  const q = item.question;
  if (MCQ_LIKE_TYPES.includes(q.type as (typeof MCQ_LIKE_TYPES)[number])) {
    const correct = q.options.find((o) => o.isCorrect);
    return correct ? `${correct.label}. ${correct.text}` : "(answer not set)";
  }
  if (q.type === "MATCH_FOLLOWING") {
    return q.options.map((o, i) => `${i + 1}-${o.matchText}`).join(", ");
  }
  return q.answerText ?? "(see key points below)";
}

export async function buildAnswerKeyDocx(paper: PaperContentModel): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({ text: `${paper.title} — Answer Key`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
    new Paragraph({
      text: `${paper.totalQuestions} questions — ${paper.totalMarks} marks total`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  ];

  for (const section of paper.sections) {
    children.push(new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
    for (const item of section.items) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Q${item.number}. `, bold: true }), new TextRun({ text: answerSummary(item) })],
        }),
      );
      if (item.question.explanation) {
        children.push(new Paragraph({ text: `Explanation: ${item.question.explanation}`, spacing: { after: 100 } }));
      }
      const scheme = item.question.markingScheme;
      if (Array.isArray(scheme)) {
        for (const m of scheme as { criterion: string; marks: number }[]) {
          children.push(new Paragraph({ text: `• ${m.criterion} — ${m.marks} mark(s)` }));
        }
      }
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
