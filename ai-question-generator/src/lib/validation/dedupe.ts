const STOPWORDS = new Set(
  "a an the is are was were be been being of to in on for with and or but if then than as at by from this that these those it its into about which what who whom when where why how do does did not no".split(
    " ",
  ),
);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

/** Jaccard similarity over meaningful tokens — a cheap stand-in for semantic
 * duplicate detection (spec section 38) that catches paraphrases like
 * "What is photosynthesis?" vs "Define the process of photosynthesis"
 * without needing an embeddings call for every question. */
export function textSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) if (setB.has(token)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export const DUPLICATE_SIMILARITY_THRESHOLD = 0.6;

export function findSimilarIndex(text: string, existing: string[]): number {
  for (let i = 0; i < existing.length; i++) {
    if (textSimilarity(text, existing[i]) >= DUPLICATE_SIMILARITY_THRESHOLD) return i;
  }
  return -1;
}
