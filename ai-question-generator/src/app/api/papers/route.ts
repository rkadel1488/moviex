import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, handleApiError, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { PAPER_TEMPLATES } from "@/lib/constants";
import { summarizePaper } from "@/lib/papers";

const sectionItemSchema = z.object({
  questionId: z.string(),
  order: z.number().int().default(0),
  marksOverride: z.number().positive().optional(),
  isOptional: z.boolean().default(false),
});

const sectionSchema = z.object({
  title: z.string().min(1),
  instructions: z.string().optional(),
  order: z.number().int().default(0),
  items: z.array(sectionItemSchema).default([]),
});

const metaSchema = z.object({
  schoolName: z.string().optional(),
  schoolLogoUrl: z.string().optional(),
  examName: z.string().optional(),
  academicSession: z.string().optional(),
  subject: z.string().optional(),
  grade: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  fullMarks: z.number().optional(),
  passMarks: z.number().optional(),
  instructions: z.array(z.string()).default([]),
});

const createSchema = z.object({
  title: z.string().min(1),
  templateStyle: z.enum(PAPER_TEMPLATES).default("SCHOOL_EXAM"),
  meta: metaSchema.default({}),
  sections: z.array(sectionSchema).default([]),
});

export async function GET() {
  try {
    const user = await requireUser();
    const papers = await prisma.questionPaper.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { updatedAt: "desc" },
      include: { sections: { include: { items: { include: { question: true } } } } },
    });
    return NextResponse.json({
      papers: papers.map((p) => ({ ...p, summary: summarizePaper(p) })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid paper");
    const data = parsed.data;

    const paper = await prisma.questionPaper.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        title: data.title,
        templateStyle: data.templateStyle,
        meta: data.meta,
        sections: {
          create: data.sections.map((section) => ({
            title: section.title,
            instructions: section.instructions,
            order: section.order,
            items: {
              create: section.items.map((item) => ({
                questionId: item.questionId,
                order: item.order,
                marksOverride: item.marksOverride,
                isOptional: item.isOptional,
              })),
            },
          })),
        },
      },
      include: { sections: { include: { items: { include: { question: true } } } } },
    });

    return NextResponse.json({ paper: { ...paper, summary: summarizePaper(paper) } });
  } catch (error) {
    return handleApiError(error);
  }
}
