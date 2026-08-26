import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const document = await prisma.document.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { chunks: { orderBy: { index: "asc" } } },
    });
    if (!document) throw new ApiError("Document not found", 404);
    return NextResponse.json({ document });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const document = await prisma.document.findFirst({ where: { id, organizationId: user.organizationId } });
    if (!document) throw new ApiError("Document not found", 404);
    await prisma.document.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
