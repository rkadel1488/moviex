import { NextRequest, NextResponse } from "next/server";
import { requireUser, handleApiError, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { extractDocument, chunkText } from "@/lib/documents/extract";
import type { DocumentSourceType } from "@/lib/constants";
import { DOCUMENT_SOURCE_TYPES } from "@/lib/constants";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME: Record<string, DocumentSourceType> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
};

export async function GET() {
  try {
    const user = await requireUser();
    const documents = await prisma.document.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        sourceType: true,
        status: true,
        pageCount: true,
        errorMessage: true,
        createdAt: true,
        _count: { select: { chunks: true, questions: true } },
      },
    });
    return NextResponse.json({ documents });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const contentType = request.headers.get("content-type") ?? "";

    let sourceType: DocumentSourceType;
    let title: string;
    let text = "";
    let buffer: Buffer | undefined;
    let originalFilename: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      title = String(form.get("title") ?? "");

      if (!(file instanceof File)) {
        throw new ApiError("No file provided");
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new ApiError("File exceeds the 15 MB upload limit");
      }
      const detected = ALLOWED_MIME[file.type];
      if (!detected) {
        throw new ApiError("Only PDF and DOCX uploads are supported");
      }
      sourceType = detected;
      originalFilename = file.name;
      buffer = Buffer.from(await file.arrayBuffer());
      if (!title) title = file.name.replace(/\.[^.]+$/, "");
    } else {
      const body = await request.json();
      const mode = String(body.sourceType ?? "TEXT").toUpperCase();
      if (!DOCUMENT_SOURCE_TYPES.includes(mode as DocumentSourceType)) {
        throw new ApiError("Invalid sourceType");
      }
      sourceType = mode as DocumentSourceType;
      text = String(body.text ?? "").trim();
      title = String(body.title ?? "").trim();
      if (!text) throw new ApiError("Text content is required");
      if (!title) title = text.slice(0, 60);
    }

    const document = await prisma.document.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        title,
        sourceType,
        originalFilename,
        status: "PROCESSING",
      },
    });

    try {
      const extracted = await extractDocument(sourceType, { buffer, text });
      const chunks = chunkText(extracted.text);

      if (sourceType !== "TOPIC" && chunks.length === 0) {
        throw new ApiError("No readable text could be extracted from this file");
      }

      await prisma.$transaction([
        prisma.document.update({
          where: { id: document.id },
          data: {
            rawText: extracted.text.slice(0, 2_000_000),
            pageCount: extracted.pageCount,
            status: "READY",
          },
        }),
        prisma.documentChunk.createMany({
          data: chunks.map((chunk) => ({
            documentId: document.id,
            index: chunk.index,
            content: chunk.content,
            heading: chunk.heading,
            page: chunk.page,
          })),
        }),
      ]);
    } catch (extractError) {
      const message = extractError instanceof Error ? extractError.message : "Extraction failed";
      await prisma.document.update({ where: { id: document.id }, data: { status: "FAILED", errorMessage: message } });
      throw new ApiError(message, 422);
    }

    const full = await prisma.document.findUnique({
      where: { id: document.id },
      include: { _count: { select: { chunks: true } } },
    });

    return NextResponse.json({ document: full });
  } catch (error) {
    return handleApiError(error);
  }
}
