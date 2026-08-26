import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const original = await prisma.question.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { options: true },
    });
    if (!original) throw new ApiError("Question not found", 404);

    const copy = await prisma.question.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        documentId: original.documentId,
        type: original.type,
        subjectId: original.subjectId,
        gradeId: original.gradeId,
        chapterId: original.chapterId,
        topicId: original.topicId,
        learningOutcomeId: original.learningOutcomeId,
        bloomLevel: original.bloomLevel,
        difficulty: original.difficulty,
        marks: original.marks,
        caseGroupId: original.caseGroupId,
        caseContext: original.caseContext,
        questionText: `${original.questionText} (Copy)`,
        answerText: original.answerText,
        explanation: original.explanation,
        markingScheme: original.markingScheme ?? undefined,
        rubric: original.rubric ?? undefined,
        wordBank: original.wordBank ?? undefined,
        sourceOnly: original.sourceOnly,
        sourceRef: original.sourceRef ?? undefined,
        tags: original.tags ?? undefined,
        language: original.language,
        options: {
          create: original.options.map((o) => ({
            label: o.label,
            text: o.text,
            matchText: o.matchText,
            isCorrect: o.isCorrect,
            order: o.order,
          })),
        },
      },
      include: { options: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ question: copy });
  } catch (error) {
    return handleApiError(error);
  }
}
