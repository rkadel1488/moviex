import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, handleApiError, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { transformQuestion, TRANSFORM_ACTIONS } from "@/lib/ai/transform";
import { BLOOM_LEVELS, DIFFICULTY_LEVELS, QUESTION_TYPES } from "@/lib/constants";

const bodySchema = z.object({
  action: z.enum(TRANSFORM_ACTIONS),
  targetType: z.enum(QUESTION_TYPES).optional(),
  targetBloomLevel: z.enum(BLOOM_LEVELS).optional(),
  targetDifficulty: z.enum(DIFFICULTY_LEVELS).optional(),
  targetMarks: z.number().positive().optional(),
  instruction: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const question = await prisma.question.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { options: true },
    });
    if (!question) throw new ApiError("Question not found", 404);

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid transform request");
    const { action, ...transformParams } = parsed.data;

    const result = await transformQuestion(question, action, transformParams);

    const updated = await prisma.$transaction(async (tx) => {
      if (result.options) {
        await tx.questionOption.deleteMany({ where: { questionId: id } });
        await tx.questionOption.createMany({
          data: result.options.map((o, i) => ({
            questionId: id,
            label: o.label,
            text: o.text,
            matchText: o.matchText,
            isCorrect: o.isCorrect,
            order: i,
          })),
        });
      }
      return tx.question.update({
        where: { id },
        data: {
          type: result.type,
          questionText: result.questionText,
          caseContext: result.caseContext ?? (action === "CONVERT_TYPE" ? null : undefined),
          answerText: action === "GENERATE_EXPLANATION" ? undefined : result.answerText,
          explanation: result.explanation ?? question.explanation,
          marks: transformParams.targetMarks ?? result.marks ?? question.marks,
          bloomLevel: result.bloomLevel ?? (action === "CHANGE_BLOOM" ? transformParams.targetBloomLevel : undefined),
          difficulty: result.difficulty,
          wordBank: result.wordBank ?? undefined,
        },
        include: { options: { orderBy: { order: "asc" } } },
      });
    });

    return NextResponse.json({ question: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
