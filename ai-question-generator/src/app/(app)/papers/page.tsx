"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PAPER_TEMPLATE_LABELS } from "@/lib/constants";
import type { PaperTemplate } from "@/lib/constants";

interface PaperListItem {
  id: string;
  title: string;
  templateStyle: string;
  updatedAt: string;
  summary: { totalQuestions: number; totalMarks: number };
}

export default function PapersPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<PaperListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/papers");
    const data = await res.json();
    setPapers(data.papers ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function createBlank() {
    setCreating(true);
    const res = await fetch("/api/papers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Question Paper", sections: [{ title: "SECTION A", order: 0, items: [] }] }),
    });
    const data = await res.json();
    setCreating(false);
    if (res.ok) router.push(`/papers/${data.paper.id}`);
  }

  async function remove(id: string) {
    if (!confirm("Delete this question paper?")) return;
    await fetch(`/api/papers/${id}`, { method: "DELETE" });
    setPapers((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Question Papers</h1>
        <button className="btn btn-primary" onClick={createBlank} disabled={creating}>
          + New Paper
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading...</p>
      ) : papers.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No question papers yet. Generate some questions and finalize them into a paper, or start a blank one.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {papers.map((p) => (
            <div key={p.id} className="card space-y-2 p-4">
              <Link href={`/papers/${p.id}`} className="font-semibold hover:underline">
                {p.title}
              </Link>
              <div className="text-xs text-[var(--muted)]">{PAPER_TEMPLATE_LABELS[p.templateStyle as PaperTemplate] ?? p.templateStyle}</div>
              <div className="text-xs">
                {p.summary.totalQuestions} question(s) · {p.summary.totalMarks} marks
              </div>
              <div className="flex justify-end gap-2 text-xs">
                <button className="text-red-600 hover:underline" onClick={() => remove(p.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
