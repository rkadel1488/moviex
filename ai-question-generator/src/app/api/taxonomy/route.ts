import { NextResponse } from "next/server";
import { requireUser, handleApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();
    const [subjects, grades] = await Promise.all([
      prisma.subject.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } }),
      prisma.grade.findMany({ where: { organizationId: user.organizationId }, orderBy: { name: "asc" } }),
    ]);
    return NextResponse.json({ subjects, grades });
  } catch (error) {
    return handleApiError(error);
  }
}
