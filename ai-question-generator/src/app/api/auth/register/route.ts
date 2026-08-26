import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  organizationName: z.string().min(1).max(150).optional(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, email, password, organizationName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: organizationName?.trim() || `${name}'s Workspace` },
    });
    return tx.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "TEACHER",
        organizationId: organization.id,
      },
    });
  });

  await createSession({ userId: user.id, organizationId: user.organizationId, role: user.role });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
