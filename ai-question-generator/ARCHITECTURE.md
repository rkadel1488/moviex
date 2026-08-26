# AI Question Generator — Architecture

This document covers the items requested in the original brief (Section 45,
A–J): product architecture, MVP scope, tech stack, database schema, AI/RAG
workflow, page map, question-generation JSON schema, internal AI prompts,
and the roadmap. It reflects what is actually implemented, not aspirational
design — deviations from the original 45-section spec are called out with
the reasoning.

## A. Product architecture

A single Next.js (App Router) application, deployed as its own project —
**it is not part of the "MovieX" app that otherwise lives in this
repository**; the two share a git history but nothing else (no shared code,
no shared database, no shared deployment). Structure:

```
Browser (React client components)
   │  fetch()
   ▼
Next.js Route Handlers (src/app/api/**)   — auth, CRUD, generation, export
   │
   ├── src/lib/auth.ts            session cookies (JWT via jose) + bcrypt
   ├── src/lib/documents/         PDF/DOCX/text extraction + chunking
   ├── src/lib/rag/retrieve.ts    chunk selection (keyword scoring today,
   │                              pgvector-ready — see schema note)
   ├── src/lib/ai/                provider abstraction, prompts, pipeline
   ├── src/lib/validation/       deterministic quality checks + dedupe
   ├── src/lib/export/            PDF (@react-pdf/renderer) & Word (docx)
   └── src/lib/prisma.ts           Prisma client → SQLite (dev) / Postgres (prod)
```

Multi-tenancy is organization-scoped: every row that matters (documents,
questions, banks, papers) carries an `organizationId`, and every API route
filters by the caller's `organizationId` — never by a raw `userId` alone —
so one school's material never leaks into another's queries.

## B. MVP feature list (implemented)

Everything in the brief's Section 43 MVP list is implemented:
auth, dashboard, text/PDF/DOCX input, extraction, generation config, MCQ,
fill-in-the-blank, true/false, match-the-following, very-short/short/long
answer, question–answer, application-based, case-based (+ case-based MCQ),
HOTS, Bloom's taxonomy tagging, difficulty levels, answers, explanations,
question editing, question bank, question paper builder, answer key, PDF
export, Word export, and source-grounded generation.

Deliberate MVP scope cuts (all straightforward to add on this foundation):
- **Multiple-correct-answer MCQ, Yes/No, and the long tail of the ~60 named
  question formats** — the 12 implemented types (see `src/lib/constants.ts`)
  cover every *structural* pattern the other formats need (single/multi
  option, blank, pairing, free response, case-grouped). Adding e.g.
  "Assertion–Reason" is a prompt-template change, not an architecture change.
- **Blueprint Generator, Coverage Analysis, Question Quality Score UI,
  AI chat-driven bulk editing (Section 22), Learning-Outcome auto-tagging
  at generation time** — the data model already has the hooks
  (`LearningOutcome`, `Question.qualityScore`) but the generation pipeline
  doesn't populate/expose all of them yet.
- **OAuth/Google login** — email+password only; the `User` model has no
  provider lock-in, so adding an OAuth provider is additive.
- **pgvector embeddings** — retrieval uses keyword scoring today (cheap,
  zero extra infra); `DocumentChunk.embedding` exists as a JSON column so a
  background embeddings job + cosine-similarity query can replace it later
  without touching callers (see `src/lib/rag/retrieve.ts`).
- **OCR for scanned images/PPTX upload** — PDF and DOCX only; the
  `Document.sourceType` enum and upload route are structured so adding a
  type is a new `extract*()` function, not a redesign.

## C. Tech stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4.
- **Backend**: Next.js Route Handlers (no separate API server).
- **Database**: Prisma ORM. Ships against **SQLite** so it runs with zero
  external infra (`DATABASE_URL="file:./dev.db"`); switching to
  **PostgreSQL** for production is a one-line `provider` change in
  `prisma/schema.prisma` (see the comment at the top of that file) — no
  field-level migration needed, and it's what unlocks pgvector.
- **Auth**: Custom email/password (bcrypt + signed JWT session cookie via
  `jose`, checked in `src/proxy.ts`). No framework lock-in; Google OAuth can
  be layered on without touching the session model.
- **AI**: Anthropic Claude via `@anthropic-ai/sdk`, behind a provider
  interface (`src/lib/ai/provider.ts`) so OpenAI/Gemini/etc. can be added by
  implementing one interface — nothing else in the app changes.
- **Document processing**: `pdf-parse` (PDF), `mammoth` (DOCX).
- **Export**: `@react-pdf/renderer` (PDF), `docx` (Word).

## D. Database schema

See `prisma/schema.prisma` (the source of truth) for the full model with
field-level comments. Summary of the graph:

```
Organization ──┬── User
               ├── Subject ── Chapter ── Topic
               ├── Grade
               ├── Document ── DocumentChunk
               ├── Question ── QuestionOption
               ├── QuestionBank ── QuestionBankItem ── Question
               ├── QuestionPaper ── QuestionPaperSection ── QuestionPaperSectionItem ── Question
               └── Template

GenerationJob → Document, User, Question[]     (audit trail + token usage per generation call)
LearningOutcome → Question                       (many-to-one; free-text LO catalogue)
```

Enums (question type, Bloom level, difficulty, curriculum board, paper
template) are modeled as **plain strings validated by zod at the API
boundary**, not Prisma/DB enums — deliberately, so a school can type a
curriculum board or a new question-type label without a migration, per the
brief's "don't hard-code curriculum logic" requirement (Section 7).

## E. AI / RAG workflow

```
Upload (PDF/DOCX/text/topic)
   → extractDocument()        text out (page-tagged for PDFs)
   → chunkText()               paragraph-aware chunks, ~1.4k chars, heading-aware
   → DocumentChunk rows stored
   ↓ (at generation time)
getRelevantChunks(documentId, config)
   → if the whole document fits a ~9k-char budget, use it all
   → else score chunks by keyword overlap with topic/chapter/subtopic/LOs,
     take the top-scoring ones up to budget, re-sort into document order
   ↓
buildSystemPrompt(config) + buildUserPrompt(config, chunks, priorQuestionTexts)
   ↓
AIProvider.generateStructured()   — Anthropic tool-use with a forced
                                     JSON-schema tool call (no free-text
                                     parsing / no hallucinated shape)
   ↓
validateQuestion() — deterministic checks (single correct MCQ answer,
                      distractor distinctness, visible fill-blank marker,
                      case-group presence, positive marks, ...)
   ↓
findSimilarIndex() — Jaccard token-overlap dedupe against already-accepted
                      questions in this batch (catches paraphrases cheaply,
                      no embeddings call needed)
   ↓
if the batch under-delivered vs. the request, one top-up generation call
(MAX_GENERATION_ATTEMPTS_PER_BATCH = 2 total) asking only for the shortfall
   ↓
persist Question + QuestionOption rows, resolving/creating Subject → Chapter
→ Topic rows, mapping caseGroupKey → a stable caseGroupId, and carrying the
sourceRef (chunkId/page/section) through for "View Source" in the UI
```

This is the cost-control design from Section 34: chunking + a fixed context
budget bound the tokens sent per call, and the dedupe/validation steps are
deterministic (no extra LLM calls) so quality control doesn't multiply
spend.

## F. Page map

| Route | Purpose |
|---|---|
| `/login`, `/register` | Auth (public) |
| `/dashboard` | Stats + recent documents/papers + Quick Generate |
| `/generate` | The 4-stage wizard: Source → Configure → Generate & Review → Finalize (save to bank / create paper) |
| `/documents` | Upload (paste/PDF/DOCX/topic) + list + status |
| `/bank` | All-questions filterable table + named Collections tab |
| `/bank/[id]` | One collection's questions |
| `/papers` | Saved question papers list |
| `/papers/[id]` | Paper builder: meta/formatting, sections, question picker, export links |
| `/settings` | Account/org info, AI provider note |

The brief's "Step 1–6" workflow (Upload → Configure → Generate → Review/Edit
→ Create Paper → Export) is implemented as 4 wizard stages rather than 6
separate screens — Review/Edit happens inline with Generate (you see results
immediately below the generate button), and Export happens on the paper
detail page rather than as a final wizard step, since a paper may be revised
many times before exporting.

## G. Question-generation JSON schema

The LLM is forced (Anthropic tool-use, not prompt-and-hope) to return this
shape — see `src/lib/ai/schema.ts` for the exact JSON Schema and the zod
mirror used as a runtime safety net:

```ts
{
  questions: Array<{
    type: QuestionType;              // one of QUESTION_TYPES
    questionText: string;
    caseContext?: string;            // shared passage, case-based only
    caseGroupKey?: string;           // links sub-questions of one case
    options?: { label, text, matchText?, isCorrect }[];
    wordBank?: string[];
    answerText?: string;
    explanation?: string;
    markingScheme?: { criterion, marks }[];
    rubric?: { criteria: [{ name, levels: [{ score, label, description }] }] };
    bloomLevel?: BloomLevel;
    difficulty?: DifficultyLevel;
    marks: number;
    sourceRef?: { page?, paragraph?, section?, chunkId? };
  }>
}
```

## H. Internal AI system prompt

Built dynamically per request in `src/lib/ai/prompts.ts::buildSystemPrompt`,
not a single static string — because the rules that matter (source-only vs.
open-domain, MCQ option count, whether marking schemes/rubrics are wanted)
depend on the teacher's configuration. The fixed backbone covers, in order:
grade/subject register, source-grounding (strict "never fabricate" mode vs.
supplemented mode), the quality rules from Section 36 (no filler questions,
no near-duplicates, cognitive-demand-based difficulty, application questions
must transfer to a new situation), MCQ construction rules (plausible
distractors, no "all/none of the above", exactly one correct answer),
match-the-following/fill-blank/case-based structural rules, and a directive
to call the `emit_questions` tool exactly once with no prose outside it. The
per-request user prompt then supplies the numbered source excerpts, the
exact type/count/marks distribution requested, and the difficulty/Bloom
targets — see `buildUserPrompt`.

## I. Risks & edge cases handled

- **Fabrication under Source-Only mode**: enforced by prompt instruction +
  `sourceRef` requirement; not machine-verified line-by-line (that would
  need a second LLM call per question, which Section 34's cost-control goal
  argues against for an MVP). Flagged as a V2 item below.
- **Model returns fewer questions than requested**: expected and surfaced
  to the user rather than padded with filler (Section 36, rule 1) — the
  UI shows "(some were dropped by quality/duplicate checks)".
  - **Extraction failure** (corrupt PDF, empty DOCX): `Document.status` flips to
  `FAILED` with `errorMessage` shown in the Documents list; the document is
  still created (not silently dropped) so the teacher sees what happened.
- **Large documents**: chunking + a fixed retrieval budget (9k chars) keep
  a single generation call's cost bounded regardless of document size.
- **Duplicate detection false negatives**: Jaccard token overlap is a
  heuristic, not semantic embeddings — it catches close paraphrases but not
  all conceptual repeats. Documented as a keyword-vs-embeddings tradeoff.

## J. Roadmap (V2+)

Priority-ordered, each buildable without a schema rewrite:
1. Embeddings-backed retrieval (populate `DocumentChunk.embedding`, swap the
   scorer in `src/lib/rag/retrieve.ts` for pgvector cosine similarity).
2. Blueprint Generator + Coverage Analysis (both read-only aggregations over
   existing `Question`/`LearningOutcome` data).
3. AI chat-driven bulk editing (Section 22) on top of the existing
   `transformQuestion()` primitive.
4. Multiple-correct-answer MCQ, Assertion–Reason, and the remaining named
   question formats as new `QuestionType` values + prompt rules.
5. Google OAuth, role-based permission enforcement beyond "organization
   scoping" (Section 27's Admin/School Admin/Exam Coordinator roles exist
   in the `User.role` field but aren't yet gated in the UI/API).
6. Per-user AI usage tracking/cost dashboard (Section 34) — `GenerationJob`
   already records `inputTokens`/`outputTokens` per call; needs aggregation
   + a UI.
7. Online exam/quiz delivery, student-facing flows, LMS integration
   (Section 41) — deliberately out of scope for a teacher-authoring MVP.
