import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, handleApiError, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { generateQuestions } from "@/lib/ai/generate";
import { BLOOM_LEVELS, DIFFICULTY_LEVELS, QUESTION_TYPES } from "@/lib/constants";

const questionTypeRequestSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  count: z.number().int().min(1).max(50),
  marksEach: z.number().positive(),
  case: z.object({ subQuestionTypes: z.array(z.enum(QUESTION_TYPES)) }).optional(),
  optionCount: z.number().int().min(3).max(6).optional(),
  blanksPerQuestion: z.number().int().min(1).max(5).optional(),
  useWordBank: z.boolean().optional(),
});

const configSchema = z.object({
  subject: z.string().min(1),
  grade: z.string().min(1),
  board: z.string().optional(),
  chapter: z.string().optional(),
  topic: z.string().optional(),
  subtopic: z.string().optional(),
  language: z.string().default("en"),
  questionTypes: z.array(questionTypeRequestSchema).min(1),
  totalQuestions: z.number().int().min(1),
  totalMarks: z.number().optional(),
  difficulty: z.union([z.literal("AUTO_BALANCED"), z.literal("MIXED"), z.enum(DIFFICULTY_LEVELS)]),
  difficultyDistribution: z.record(z.string(), z.number()).optional(),
  bloomLevels: z.union([z.literal("AUTO_BALANCED"), z.array(z.enum(BLOOM_LEVELS))]),
  bloomDistribution: z.record(z.string(), z.number()).optional(),
  learningOutcomes: z.array(z.string()).optional(),
  competency: z.string().optional(),
  questionLength: z.enum(["BRIEF", "STANDARD", "DETAILED"]).optional(),
  answerLength: z.enum(["BRIEF", "STANDARD", "DETAILED"]).optional(),
  includeAnswers: z.boolean(),
  includeExplanations: z.boolean(),
  includeMarkingScheme: z.boolean(),
  includeRubric: z.boolean(),
  randomizeQuestions: z.boolean().optional(),
  randomizeOptions: z.boolean().optional(),
  avoidDuplicates: z.boolean(),
  sourceOnly: z.boolean(),
  numberOfCases: z.number().optional(),
  questionsPerCase: z.number().optional(),
});

const bodySchema = z.object({
  documentId: z.string().optional(),
  config: configSchema,
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid generation request");
    }
    const { documentId, config } = parsed.data;

    if (documentId) {
      const document = await prisma.document.findFirst({ where: { id: documentId, organizationId: user.organizationId } });
      if (!document) throw new ApiError("Document not found", 404);
    } else if (config.sourceOnly) {
      throw new ApiError('Provide a document, or turn off "Use Source Material Only" to generate from a topic alone');
    }

    const outcome = await generateQuestions({
      userId: user.id,
      organizationId: user.organizationId,
      documentId,
      config,
    });

    const questions = await prisma.question.findMany({
      where: { id: { in: outcome.questionIds } },
      include: { options: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ ...outcome, questions });
  } catch (error) {
    return handleApiError(error);
  }
}
