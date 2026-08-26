import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, handleApiError, ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();
    const banks = await prisma.questionBank.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
    });
    return NextResponse.json({ banks });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({ name: z.string().min(1), description: z.string().optional() });

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid bank");
    const bank = await prisma.questionBank.create({
      data: { userId: user.id, organizationId: user.organizationId, ...parsed.data },
    });
    return NextResponse.json({ bank });
  } catch (error) {
    return handleApiError(error);
  }
}
