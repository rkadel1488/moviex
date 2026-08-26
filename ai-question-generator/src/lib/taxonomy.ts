import { prisma } from "@/lib/prisma";

export async function getOrCreateSubject(organizationId: string, name: string) {
  return prisma.subject.upsert({
    where: { organizationId_name: { organizationId, name } },
    update: {},
    create: { organizationId, name },
  });
}

export async function getOrCreateGrade(organizationId: string, name: string) {
  return prisma.grade.upsert({
    where: { organizationId_name: { organizationId, name } },
    update: {},
    create: { organizationId, name },
  });
}

export async function getOrCreateChapter(subjectId: string, name: string) {
  const existing = await prisma.chapter.findFirst({ where: { subjectId, name } });
  if (existing) return existing;
  return prisma.chapter.create({ data: { subjectId, name } });
}

export async function getOrCreateTopic(chapterId: string, name: string) {
  const existing = await prisma.topic.findFirst({ where: { chapterId, name } });
  if (existing) return existing;
  return prisma.topic.create({ data: { chapterId, name } });
}

export async function getOrCreateLearningOutcome(description: string) {
  const existing = await prisma.learningOutcome.findFirst({ where: { description } });
  if (existing) return existing;
  const count = await prisma.learningOutcome.count();
  return prisma.learningOutcome.create({ data: { code: `LO${count + 1}`, description } });
}
