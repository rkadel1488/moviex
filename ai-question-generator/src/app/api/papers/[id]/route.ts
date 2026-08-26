import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, handleApiError, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { PAPER_TEMPLATES } from "@/lib/constants";
import { summarizePaper } from "@/lib/papers";

const include = { sections: { include: { items: { include: { question: { include: { options: true } } } } } } } as const;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const paper = await prisma.questionPaper.findFirst({
      where: { id, organizationId: user.organizationId },
      include,
    });
    if (!paper) throw new ApiError("Question paper not found", 404);
    return NextResponse.json({ paper: { ...paper, summary: summarizePaper(paper) } });
  } catch (error) {
    return handleApiError(error);
  }
}

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

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  templateStyle: z.enum(PAPER_TEMPLATES).optional(),
  meta: metaSchema.optional(),
  sections: z.array(sectionSchema).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await prisma.questionPaper.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!existing) throw new ApiError("Question paper not found", 404);

    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid update");
    const data = parsed.data;

    const paper = await prisma.$transaction(async (tx) => {
      if (data.sections) {
        // Whole-paper builder: replace the section tree atomically rather
        // than diffing — simpler and safe since papers are edited by one
        // teacher in one browser tab at a time.
        await tx.questionPaperSection.deleteMany({ where: { questionPaperId: id } });
        for (const section of data.sections) {
          await tx.questionPaperSection.create({
            data: {
              questionPaperId: id,
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
            },
          });
        }
      }
      return tx.questionPaper.update({
        where: { id },
        data: {
          title: data.title,
          templateStyle: data.templateStyle,
          meta: data.meta,
        },
        include,
      });
    });

    return NextResponse.json({ paper: { ...paper, summary: summarizePaper(paper) } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await prisma.questionPaper.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!existing) throw new ApiError("Question paper not found", 404);
    await prisma.questionPaper.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
