import { z } from "zod";
import { BLOOM_LEVELS, DIFFICULTY_LEVELS, QUESTION_TYPES } from "@/lib/constants";

const optionSchema = z.object({
  label: z.string(),
  text: z.string(),
  matchText: z.string().optional(),
  isCorrect: z.boolean(),
});

const markingSchemeItemSchema = z.object({
  criterion: z.string(),
  marks: z.number(),
});

const rubricSchema = z.object({
  criteria: z.array(
    z.object({
      name: z.string(),
      levels: z.array(
        z.object({
          score: z.number(),
          label: z.string(),
          description: z.string(),
        }),
      ),
    }),
  ),
});

export const generatedQuestionSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  questionText: z.string().min(1),
  caseContext: z.string().optional(),
  caseGroupKey: z.string().optional(),
  options: z.array(optionSchema).optional(),
  wordBank: z.array(z.string()).optional(),
  answerText: z.string().optional(),
  explanation: z.string().optional(),
  markingScheme: z.array(markingSchemeItemSchema).optional(),
  rubric: rubricSchema.optional(),
  bloomLevel: z.enum(BLOOM_LEVELS).optional(),
  difficulty: z.enum(DIFFICULTY_LEVELS).optional(),
  marks: z.number().positive(),
  sourceRef: z
    .object({
      page: z.number().optional(),
      paragraph: z.number().optional(),
      section: z.string().optional(),
      chunkId: z.string().optional(),
    })
    .optional(),
});

export const generatedBatchSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(1),
});

export type GeneratedBatch = z.infer<typeof generatedBatchSchema>;

/**
 * Hand-authored JSON Schema mirroring `generatedBatchSchema`, passed to the
 * model as a forced tool call so the response is structurally guaranteed
 * (Anthropic tool-use `input_schema`). Keep in sync with the zod schema
 * above — the zod schema is the runtime safety net in case a provider
 * doesn't support forced tool schemas.
 */
export const GENERATED_BATCH_JSON_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: QUESTION_TYPES as unknown as string[] },
          questionText: { type: "string" },
          caseContext: { type: "string", description: "Shared case/passage/scenario text. Only on the first question of a case group." },
          caseGroupKey: { type: "string", description: "Shared id linking sub-questions of the same case together." },
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                text: { type: "string" },
                matchText: { type: "string", description: "Right-column value, only for MATCH_FOLLOWING pairs." },
                isCorrect: { type: "boolean" },
              },
              required: ["label", "text", "isCorrect"],
            },
          },
          wordBank: { type: "array", items: { type: "string" } },
          answerText: { type: "string" },
          explanation: { type: "string" },
          markingScheme: {
            type: "array",
            items: {
              type: "object",
              properties: { criterion: { type: "string" }, marks: { type: "number" } },
              required: ["criterion", "marks"],
            },
          },
          rubric: {
            type: "object",
            properties: {
              criteria: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    levels: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          score: { type: "number" },
                          label: { type: "string" },
                          description: { type: "string" },
                        },
                        required: ["score", "label", "description"],
                      },
                    },
                  },
                  required: ["name", "levels"],
                },
              },
            },
            required: ["criteria"],
          },
          bloomLevel: { type: "string", enum: BLOOM_LEVELS as unknown as string[] },
          difficulty: { type: "string", enum: DIFFICULTY_LEVELS as unknown as string[] },
          marks: { type: "number" },
          sourceRef: {
            type: "object",
            properties: {
              page: { type: "number" },
              paragraph: { type: "number" },
              section: { type: "string" },
              chunkId: { type: "string" },
            },
          },
        },
        required: ["type", "questionText", "marks"],
      },
    },
  },
  required: ["questions"],
} as const;
