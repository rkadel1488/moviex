import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { buildPaperContentModel } from "@/lib/export/paperModel";
import { buildAnswerKeyDocx } from "@/lib/export/docx";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const paper = await prisma.questionPaper.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { sections: { include: { items: { include: { question: { include: { options: true } } } } } } },
    });
    if (!paper) throw new ApiError("Question paper not found", 404);

    const model = buildPaperContentModel(paper);
    const buffer = await buildAnswerKeyDocx(model);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${slug(paper.title)}-answer-key.docx"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function slug(title: string) {
  return title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60) || "question-paper";
}
