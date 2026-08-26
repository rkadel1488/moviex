# AI Question Generator

Upload a chapter and create a professionally structured exam, worksheet, or
quiz in minutes. Teachers/schools provide learning material (pasted text,
PDF, DOCX, or just a topic), configure question types/difficulty/Bloom's
taxonomy, and get source-grounded, editable questions they can assemble into
a formatted question paper with an answer key.

This is a standalone app living inside the `moviex` repository for
convenience — it does not share any code, database, or deployment with the
MovieX site.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design writeup
(schema, RAG pipeline, prompts, roadmap).

## Getting started

```bash
npm install
cp .env.example .env   # then fill in AUTH_SECRET and ANTHROPIC_API_KEY
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/register` to create
your first account (this also creates your organization/workspace).

### Required environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Defaults to a local SQLite file; point at Postgres for production (see the note at the top of `prisma/schema.prisma`) |
| `AUTH_SECRET` | Signs session cookies. Generate with `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | Required for question generation (Section "AI Generation" in Settings explains the provider abstraction) |
| `AI_PROVIDER` / `ANTHROPIC_MODEL` | Optional overrides — see `src/lib/ai/provider.ts` |

Without `ANTHROPIC_API_KEY`, everything except AI generation still works:
auth, document upload/extraction, manual question authoring, the question
bank, the paper builder, and PDF/Word export.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build/serve
- `npm run lint` — ESLint
- `npm run prisma:migrate` — create/apply a migration after schema changes
- `npm run db:seed` — (placeholder) seed script location, see `prisma/seed.ts` if added later

## Project layout

```
src/app/            Next.js routes (pages under (app)/(auth), API under api/)
src/components/      Shared React components (QuestionCard, wizard pieces)
src/lib/
  ai/                Provider abstraction, prompts, generation pipeline
  documents/         Text/PDF/DOCX extraction + chunking
  rag/               Chunk retrieval for generation context
  validation/        Deterministic quality checks + duplicate detection
  export/            PDF (@react-pdf/renderer) and Word (docx) rendering
  auth.ts, api.ts, prisma.ts, constants.ts, types.ts, taxonomy.ts, papers.ts
prisma/schema.prisma Database schema (see in-file comments on Postgres/pgvector migration)
```
