import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAIProvider } from "./provider";
import { buildSystemPrompt, buildUserPrompt } from "./prompts";
import { getRelevantChunks } from "@/lib/rag/retrieve";
import { validateQuestion } from "@/lib/validation/validate";
import { findSimilarIndex } from "@/lib/validation/dedupe";
import { MIN_QUALITY_SCORE, MAX_GENERATION_ATTEMPTS_PER_BATCH } from "@/lib/constants";
import { getOrCreateChapter, getOrCreateGrade, getOrCreateSubject, getOrCreateTopic } from "@/lib/taxonomy";
import type { GenerationConfig, GeneratedQuestionPayload, QuestionTypeRequest, RetrievedChunk } from "@/lib/types";

interface AcceptedQuestion {
  payload: GeneratedQuestionPayload;
  score: number;
  issues: string[];
}

export interface GenerationOutcome {
  jobId: string;
  questionIds: string[];
  requested: number;
  generated: number;
  inputTokens: number;
  outputTokens: number;
}

export async function generateQuestions(params: {
  userId: string;
  organizationId: string;
  documentId?: string;
  config: GenerationConfig;
}): Promise<GenerationOutcome> {
  const { userId, organizationId, documentId, config } = params;
  const requestedTotal = config.questionTypes.reduce((sum, r) => sum + r.count, 0);

  const job = await prisma.generationJob.create({
    data: {
      userId,
      documentId,
      config: config as unknown as Prisma.InputJsonValue,
      status: "RUNNING",
    },
  });

  try {
    const chunks = await getRelevantChunks(documentId, config);
    const chunkById = new Map(chunks.map((c) => [c.id, c]));
    const provider = getAIProvider();

    const accepted: AcceptedQuestion[] = [];
    const acceptedTexts: string[] = [];
    let remaining: QuestionTypeRequest[] = config.questionTypes.map((r) => ({ ...r }));
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS_PER_BATCH && remaining.some((r) => r.count > 0); attempt++) {
      const attemptConfig: GenerationConfig = { ...config, questionTypes: remaining.filter((r) => r.count > 0) };
      const system = buildSystemPrompt(config);
      const prompt = buildUserPrompt(attemptConfig, chunks, acceptedTexts);

      const result = await provider.generateStructured({ system, prompt });
      totalInputTokens += result.inputTokens;
      totalOutputTokens += result.outputTokens;

      for (const q of result.data.questions) {
        const req = remaining.find((r) => r.type === q.type && r.count > 0);
        if (!req) continue; // model over-delivered a type we no longer need

        const isDuplicate = config.avoidDuplicates && findSimilarIndex(q.questionText, acceptedTexts) !== -1;
        if (isDuplicate) continue;

        const { score, issues } = validateQuestion(q, req);
        if (score < MIN_QUALITY_SCORE) continue;

        accepted.push({ payload: q, score, issues });
        acceptedTexts.push(q.questionText);
        req.count -= 1;
      }
      remaining = remaining.filter((r) => r.count > 0);
    }

    const questionIds = await persistGeneratedQuestions({
      userId,
      organizationId,
      documentId,
      jobId: job.id,
      config,
      accepted,
      chunkById,
    });

    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "SUCCEEDED",
        completedAt: new Date(),
        questionCount: questionIds.length,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
      },
    });

    return {
      jobId: job.id,
      questionIds,
      requested: requestedTotal,
      generated: questionIds.length,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
    };
  } catch (error) {
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Generation failed" },
    });
    throw error;
  }
}

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

function orderOptions(
  options: NonNullable<GeneratedQuestionPayload["options"]>,
  type: GeneratedQuestionPayload["type"],
  randomize?: boolean,
): NonNullable<GeneratedQuestionPayload["options"]> {
  if (!randomize || type === "MATCH_FOLLOWING") return options;
  const shuffled = [...options].sort(() => Math.random() - 0.5);
  return shuffled.map((opt, i) => ({ ...opt, label: OPTION_LABELS[i] ?? opt.label }));
}

async function persistGeneratedQuestions(params: {
  userId: string;
  organizationId: string;
  documentId?: string;
  jobId: string;
  config: GenerationConfig;
  accepted: AcceptedQuestion[];
  chunkById: Map<string, RetrievedChunk>;
}): Promise<string[]> {
  const { userId, organizationId, documentId, jobId, config, accepted, chunkById } = params;
  if (accepted.length === 0) return [];

  const subject = await getOrCreateSubject(organizationId, config.subject);
  const grade = await getOrCreateGrade(organizationId, config.grade);
  const chapter = config.chapter ? await getOrCreateChapter(subject.id, config.chapter) : null;
  const topic = config.topic && chapter ? await getOrCreateTopic(chapter.id, config.topic) : null;

  const caseGroupIds = new Map<string, string>();
  const ids: string[] = [];

  for (const { payload, score, issues } of accepted) {
    let caseGroupId: string | undefined;
    if (payload.caseGroupKey) {
      caseGroupId = caseGroupIds.get(payload.caseGroupKey);
      if (!caseGroupId) {
        caseGroupId = randomUUID();
        caseGroupIds.set(payload.caseGroupKey, caseGroupId);
      }
    }

    const sourceRef = payload.sourceRef?.chunkId
      ? {
          chunkId: payload.sourceRef.chunkId,
          page: chunkById.get(payload.sourceRef.chunkId)?.page ?? payload.sourceRef.page,
          section: chunkById.get(payload.sourceRef.chunkId)?.section ?? payload.sourceRef.section,
          paragraph: payload.sourceRef.paragraph,
        }
      : payload.sourceRef;

    const question = await prisma.question.create({
      data: {
        userId,
        organizationId,
        documentId,
        generationJobId: jobId,
        type: payload.type,
        subjectId: subject.id,
        gradeId: grade.id,
        chapterId: chapter?.id,
        topicId: topic?.id,
        bloomLevel: payload.bloomLevel,
        difficulty: payload.difficulty,
        marks: payload.marks,
        caseGroupId,
        caseContext: payload.caseContext,
        questionText: payload.questionText,
        answerText: payload.answerText,
        explanation: payload.explanation,
        markingScheme: payload.markingScheme as unknown as Prisma.InputJsonValue,
        rubric: payload.rubric as unknown as Prisma.InputJsonValue,
        wordBank: payload.wordBank as unknown as Prisma.InputJsonValue,
        sourceOnly: config.sourceOnly,
        sourceRef: sourceRef as unknown as Prisma.InputJsonValue,
        qualityScore: score,
        qualityIssues: issues as unknown as Prisma.InputJsonValue,
        language: config.language,
        options: payload.options
          ? {
              create: orderOptions(payload.options, payload.type, config.randomizeOptions).map((opt, i) => ({
                label: opt.label,
                text: opt.text,
                matchText: opt.matchText,
                isCorrect: opt.isCorrect,
                order: i,
              })),
            }
          : undefined,
      },
    });
    ids.push(question.id);
  }

  return ids;
}
