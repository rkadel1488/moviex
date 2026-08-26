import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, handleApiError, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ questionIds: z.array(z.string()).min(1) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const bank = await prisma.questionBank.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!bank) throw new ApiError("Question bank not found", 404);

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) throw new ApiError("questionIds is required");

    const existing = await prisma.questionBankItem.findMany({
      where: { questionBankId: id, questionId: { in: parsed.data.questionIds } },
      select: { questionId: true },
    });
    const existingIds = new Set(existing.map((e) => e.questionId));
    const newIds = parsed.data.questionIds.filter((qid) => !existingIds.has(qid));

    if (newIds.length > 0) {
      await prisma.questionBankItem.createMany({
        data: newIds.map((questionId) => ({ questionBankId: id, questionId })),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const bank = await prisma.questionBank.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!bank) throw new ApiError("Question bank not found", 404);

    const questionId = request.nextUrl.searchParams.get("questionId");
    if (!questionId) throw new ApiError("questionId query param is required");

    await prisma.questionBankItem.deleteMany({ where: { questionBankId: id, questionId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
