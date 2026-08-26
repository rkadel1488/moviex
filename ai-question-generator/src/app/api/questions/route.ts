import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, handleApiError, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { QUESTION_TYPES } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const params = request.nextUrl.searchParams;

    const where: Prisma.QuestionWhereInput = { organizationId: user.organizationId };
    const subjectId = params.get("subjectId");
    const gradeId = params.get("gradeId");
    const chapterId = params.get("chapterId");
    const topicId = params.get("topicId");
    const type = params.get("type");
    const difficulty = params.get("difficulty");
    const bloomLevel = params.get("bloomLevel");
    const documentId = params.get("documentId");
    const favorite = params.get("favorite");
    const search = params.get("search");

    if (subjectId) where.subjectId = subjectId;
    if (gradeId) where.gradeId = gradeId;
    if (chapterId) where.chapterId = chapterId;
    if (topicId) where.topicId = topicId;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (bloomLevel) where.bloomLevel = bloomLevel;
    if (documentId) where.documentId = documentId;
    if (favorite === "true") where.isFavorite = true;
    if (search) where.questionText = { contains: search };

    const sortParam = params.get("sort") ?? "createdAt:desc";
    const [sortField, sortDir] = sortParam.split(":");
    const orderBy: Prisma.QuestionOrderByWithRelationInput =
      sortField === "marks" ? { marks: (sortDir as "asc" | "desc") ?? "desc" } : { createdAt: (sortDir as "asc" | "desc") ?? "desc" };

    const page = Math.max(1, Number(params.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? "25")));

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          options: { orderBy: { order: "asc" } },
          subject: true,
          grade: true,
          chapter: true,
          topic: true,
        },
      }),
      prisma.question.count({ where }),
    ]);

    return NextResponse.json({ questions, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}

const optionInput = z.object({
  label: z.string(),
  text: z.string(),
  matchText: z.string().optional(),
  isCorrect: z.boolean().default(false),
});

const createSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  questionText: z.string().min(1),
  caseContext: z.string().optional(),
  answerText: z.string().optional(),
  explanation: z.string().optional(),
  marks: z.number().positive().default(1),
  bloomLevel: z.string().optional(),
  difficulty: z.string().optional(),
  options: z.array(optionInput).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid question");
    const data = parsed.data;

    const question = await prisma.question.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        type: data.type,
        questionText: data.questionText,
        caseContext: data.caseContext,
        answerText: data.answerText,
        explanation: data.explanation,
        marks: data.marks,
        bloomLevel: data.bloomLevel,
        difficulty: data.difficulty,
        sourceOnly: false,
        options: data.options
          ? { create: data.options.map((o, i) => ({ ...o, order: i })) }
          : undefined,
      },
      include: { options: true },
    });

    return NextResponse.json({ question });
  } catch (error) {
    return handleApiError(error);
  }
}
