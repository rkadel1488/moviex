import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const organization = await prisma.organization.findUnique({ where: { id: user.organizationId } });

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card space-y-2 p-5">
        <h2 className="font-semibold">Account</h2>
        <p className="text-sm">
          <span className="text-[var(--muted)]">Name:</span> {user.name}
        </p>
        <p className="text-sm">
          <span className="text-[var(--muted)]">Email:</span> {user.email}
        </p>
        <p className="text-sm">
          <span className="text-[var(--muted)]">Role:</span> {user.role}
        </p>
      </div>

      <div className="card space-y-2 p-5">
        <h2 className="font-semibold">Organization</h2>
        <p className="text-sm">
          <span className="text-[var(--muted)]">Name:</span> {organization?.name}
        </p>
        <p className="text-xs text-[var(--muted)]">
          All documents, questions, banks, and papers are private to your organization.
        </p>
      </div>

      <div className="card space-y-2 p-5">
        <h2 className="font-semibold">AI Generation</h2>
        <p className="text-sm text-[var(--muted)]">
          Question generation is powered by the AI provider configured by your administrator (
          <code>AI_PROVIDER</code> / <code>ANTHROPIC_API_KEY</code> environment variables). The provider is
          abstracted so additional models (OpenAI, Gemini, etc.) can be added without changing the app — see
          ARCHITECTURE.md.
        </p>
      </div>
    </div>
  );
}
