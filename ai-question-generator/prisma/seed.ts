import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@school.example";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Demo user already exists:", email);
    return;
  }

  const organization = await prisma.organization.create({ data: { name: "Demo School" } });
  const user = await prisma.user.create({
    data: {
      name: "Demo Teacher",
      email,
      passwordHash: await bcrypt.hash("password123", 10),
      role: "TEACHER",
      organizationId: organization.id,
    },
  });

  const subject = await prisma.subject.create({ data: { organizationId: organization.id, name: "Biology" } });
  const grade = await prisma.grade.create({ data: { organizationId: organization.id, name: "Grade 8" } });
  const chapter = await prisma.chapter.create({ data: { subjectId: subject.id, name: "Photosynthesis" } });

  await prisma.question.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      subjectId: subject.id,
      gradeId: grade.id,
      chapterId: chapter.id,
      type: "MCQ_SINGLE",
      questionText: "Which pigment in plants absorbs light energy for photosynthesis?",
      bloomLevel: "REMEMBER",
      difficulty: "EASY",
      marks: 1,
      sourceOnly: false,
      options: {
        create: [
          { label: "A", text: "Chlorophyll", isCorrect: true, order: 0 },
          { label: "B", text: "Melanin", isCorrect: false, order: 1 },
          { label: "C", text: "Keratin", isCorrect: false, order: 2 },
          { label: "D", text: "Hemoglobin", isCorrect: false, order: 3 },
        ],
      },
    },
  });

  console.log(`Seeded demo account: ${email} / password123`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
