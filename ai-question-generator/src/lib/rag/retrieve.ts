import { prisma } from "@/lib/prisma";
import type { GenerationConfig, RetrievedChunk } from "@/lib/types";

// Cost control (spec section 34): cap how much source text is sent per
// generation call instead of dumping the whole document into the prompt.
const CONTEXT_BUDGET_CHARS = 9000;

function keywordScore(content: string, heading: string | null, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  const haystack = `${heading ?? ""} ${content}`.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (!kw) continue;
    const needle = kw.toLowerCase();
    if (haystack.includes(needle)) score += needle.length > 3 ? 2 : 1;
  }
  return score;
}

/**
 * Selects the chunks most relevant to the requested chapter/topic/subtopic,
 * capped to a fixed character budget. This is a keyword-overlap retriever;
 * swap it for a pgvector cosine-similarity query once DocumentChunk.embedding
 * is populated by an embeddings backfill job — the call site in
 * src/lib/ai/generate.ts only depends on this function's return shape.
 */
export async function getRelevantChunks(documentId: string | undefined, config: GenerationConfig): Promise<RetrievedChunk[]> {
  if (!documentId) return [];

  const chunks = await prisma.documentChunk.findMany({
    where: { documentId },
    orderBy: { index: "asc" },
  });
  if (chunks.length === 0) return [];

  const totalChars = chunks.reduce((sum, c) => sum + c.content.length, 0);
  if (totalChars <= CONTEXT_BUDGET_CHARS) {
    return chunks.map(toRetrievedChunk);
  }

  const keywords = [config.topic, config.subtopic, config.chapter, ...(config.learningOutcomes ?? [])].filter(
    (v): v is string => Boolean(v),
  );

  const scored = chunks
    .map((chunk) => ({ chunk, score: keywordScore(chunk.content, chunk.heading, keywords) }))
    .sort((a, b) => b.score - a.score);

  const selected: typeof chunks = [];
  let budget = CONTEXT_BUDGET_CHARS;
  for (const { chunk } of scored) {
    if (budget <= 0) break;
    selected.push(chunk);
    budget -= chunk.content.length;
  }

  // Re-sort by original document order so the model reads coherent, in-order
  // material rather than shuffled fragments.
  selected.sort((a, b) => a.index - b.index);
  return selected.map(toRetrievedChunk);
}

function toRetrievedChunk(chunk: {
  id: string;
  content: string;
  heading: string | null;
  section: string | null;
  page: number | null;
}): RetrievedChunk {
  return { id: chunk.id, content: chunk.content, heading: chunk.heading, section: chunk.section, page: chunk.page };
}
