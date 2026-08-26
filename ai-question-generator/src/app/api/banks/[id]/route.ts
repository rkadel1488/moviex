import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const bank = await prisma.questionBank.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        items: {
          include: { question: { include: { options: { orderBy: { order: "asc" } } } } },
          orderBy: { addedAt: "desc" },
        },
      },
    });
    if (!bank) throw new ApiError("Question bank not found", 404);
    return NextResponse.json({ bank });
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
    await prisma.questionBank.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
