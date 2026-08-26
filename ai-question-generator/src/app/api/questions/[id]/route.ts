import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, handleApiError, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { BLOOM_LEVELS, DIFFICULTY_LEVELS } from "@/lib/constants";

async function loadOwnedQuestion(id: string, organizationId: string) {
  const question = await prisma.question.findFirst({ where: { id, organizationId }, include: { options: true } });
  if (!question) throw new ApiError("Question not found", 404);
  return question;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const question = await loadOwnedQuestion(id, user.organizationId);
    return NextResponse.json({ question });
  } catch (error) {
    return handleApiError(error);
  }
}

const optionInput = z.object({
  id: z.string().optional(),
  label: z.string(),
  text: z.string(),
  matchText: z.string().optional(),
  isCorrect: z.boolean().default(false),
});

const patchSchema = z.object({
  questionText: z.string().min(1).optional(),
  caseContext: z.string().nullable().optional(),
  answerText: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  marks: z.number().positive().optional(),
  bloomLevel: z.enum(BLOOM_LEVELS).nullable().optional(),
  difficulty: z.enum(DIFFICULTY_LEVELS).nullable().optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  learningOutcomeId: z.string().nullable().optional(),
  options: z.array(optionInput).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await loadOwnedQuestion(id, user.organizationId);

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid update");
    const data = parsed.data;

    const question = await prisma.$transaction(async (tx) => {
      if (data.options) {
        await tx.questionOption.deleteMany({ where: { questionId: id } });
        await tx.questionOption.createMany({
          data: data.options.map((o, i) => ({
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
          questionText: data.questionText,
          caseContext: data.caseContext,
          answerText: data.answerText,
          explanation: data.explanation,
          marks: data.marks,
          bloomLevel: data.bloomLevel,
          difficulty: data.difficulty,
          isFavorite: data.isFavorite,
          tags: data.tags,
          learningOutcomeId: data.learningOutcomeId,
        },
        include: { options: { orderBy: { order: "asc" } } },
      });
    });

    return NextResponse.json({ question });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await loadOwnedQuestion(id, user.organizationId);
    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
