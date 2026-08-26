import type { DocumentSourceType } from "@/lib/constants";

export interface ExtractedDocument {
  text: string;
  pageCount?: number;
}

const PAGE_MARKER = (page: number) => `\f--PAGE:${page}--\f`;
const PAGE_MARKER_RE = /\f--PAGE:(\d+)--\f/g;

async function extractPdf(buffer: Buffer): Promise<ExtractedDocument> {
  // Lazy-required: pdf-parse's index.js has a debug branch that only runs
  // when it is `require`'d as the process entrypoint, which does not happen
  // here, but keeping the import dynamic avoids pulling it into the client
  // bundle via any accidental import-graph change.
  const pdfParse = (await import("pdf-parse")).default;

  const result = await pdfParse(buffer, {
    pagerender: async (pageData: {
      pageIndex: number;
      getTextContent: () => Promise<{ items: { str: string }[] }>;
    }) => {
      const content = await pageData.getTextContent();
      const text = content.items.map((item) => item.str).join(" ");
      return `${PAGE_MARKER(pageData.pageIndex + 1)}${text}`;
    },
  });

  return { text: result.text, pageCount: result.numpages };
}

async function extractDocx(buffer: Buffer): Promise<ExtractedDocument> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value };
}

export async function extractDocument(
  sourceType: DocumentSourceType,
  input: { buffer?: Buffer; text?: string },
): Promise<ExtractedDocument> {
  if (sourceType === "PDF") {
    if (!input.buffer) throw new Error("PDF extraction requires a file buffer");
    return extractPdf(input.buffer);
  }
  if (sourceType === "DOCX") {
    if (!input.buffer) throw new Error("DOCX extraction requires a file buffer");
    return extractDocx(input.buffer);
  }
  // TEXT and TOPIC sources are already plain text.
  return { text: input.text ?? "" };
}

export interface TextChunk {
  index: number;
  content: string;
  heading?: string;
  page?: number;
}

const MAX_CHUNK_CHARS = 1400;
const MIN_CHUNK_CHARS = 400;

function looksLikeHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 90) return false;
  if (/[.!?]$/.test(trimmed)) return false;
  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 12) return false;
  const isTitleish = /^[A-Z0-9][^a-z]*$/.test(trimmed) || /^(chapter|unit|section|lesson)\b/i.test(trimmed);
  return isTitleish;
}

/**
 * Splits raw extracted text into meaningful, page-aware chunks for
 * downstream retrieval. Groups by blank-line paragraphs, folding short
 * paragraphs together and splitting overly long ones, so each chunk stays
 * within a size the LLM can reason over precisely (Section 8 of the spec).
 */
export function chunkText(rawText: string): TextChunk[] {
  let currentPage: number | undefined;
  const segments = rawText.split(PAGE_MARKER_RE);
  // segments alternates [textBeforeFirstMarker, pageNum, text, pageNum, text, ...]
  const pageTagged: { page?: number; text: string }[] = [];
  if (segments.length === 1) {
    pageTagged.push({ page: undefined, text: rawText });
  } else {
    pageTagged.push({ page: undefined, text: segments[0] });
    for (let i = 1; i < segments.length; i += 2) {
      pageTagged.push({ page: Number(segments[i]), text: segments[i + 1] ?? "" });
    }
  }

  const paragraphs: { page?: number; text: string }[] = [];
  for (const seg of pageTagged) {
    currentPage = seg.page ?? currentPage;
    const parts = seg.text
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    for (const part of parts) paragraphs.push({ page: currentPage, text: part });
  }

  const chunks: TextChunk[] = [];
  let buffer: string[] = [];
  let bufferPage: number | undefined;
  let bufferHeading: string | undefined;
  let index = 0;

  const flush = () => {
    const content = buffer.join("\n\n").trim();
    if (content.length > 0) {
      chunks.push({ index: index++, content, heading: bufferHeading, page: bufferPage });
    }
    buffer = [];
    bufferHeading = undefined;
  };

  for (const para of paragraphs) {
    if (looksLikeHeading(para.text)) {
      flush();
      bufferHeading = para.text;
      bufferPage = para.page;
      continue;
    }
    if (bufferPage === undefined) bufferPage = para.page;
    buffer.push(para.text);
    const size = buffer.join("\n\n").length;
    if (size >= MAX_CHUNK_CHARS) flush();
  }
  flush();

  // Merge trailing tiny chunks into the previous one so we don't end up with
  // noise fragments (e.g. a lone caption) as their own retrieval unit.
  const merged: TextChunk[] = [];
  for (const chunk of chunks) {
    const prev = merged[merged.length - 1];
    if (prev && chunk.content.length < MIN_CHUNK_CHARS && !chunk.heading) {
      prev.content = `${prev.content}\n\n${chunk.content}`;
    } else {
      merged.push({ ...chunk });
    }
  }
  merged.forEach((c, i) => (c.index = i));
  return merged;
}
