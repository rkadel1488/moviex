import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [questionCount, paperCount, bankCount, documentCount, recentDocuments, recentPapers] = await Promise.all([
    prisma.question.count({ where: { organizationId: user.organizationId } }),
    prisma.questionPaper.count({ where: { organizationId: user.organizationId } }),
    prisma.questionBank.count({ where: { organizationId: user.organizationId } }),
    prisma.document.count({ where: { organizationId: user.organizationId } }),
    prisma.document.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.questionPaper.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Questions Generated", value: questionCount },
    { label: "Question Papers", value: paperCount },
    { label: "Question Banks", value: bankCount },
    { label: "Documents", value: documentCount },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="text-sm text-[var(--muted)]">Upload a chapter and create a professional exam in minutes.</p>
        </div>
        <Link href="/generate" className="btn btn-primary">
          + Quick Generate
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-[var(--muted)]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent Documents</h2>
            <Link href="/documents" className="text-sm text-[var(--primary)]">
              View all
            </Link>
          </div>
          {recentDocuments.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No documents yet. Upload your first chapter to get started.</p>
          ) : (
            <ul className="space-y-2">
              {recentDocuments.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{d.title}</span>
                  <span className="badge">{d.sourceType}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent Question Papers</h2>
            <Link href="/papers" className="text-sm text-[var(--primary)]">
              View all
            </Link>
          </div>
          {recentPapers.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No question papers yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentPapers.map((p) => (
                <li key={p.id}>
                  <Link href={`/papers/${p.id}`} className="text-sm hover:underline">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
