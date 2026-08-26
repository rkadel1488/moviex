"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import type { ApiQuestion } from "@/lib/client/types";
import QuestionCard from "@/components/QuestionCard";

interface BankDetail {
  id: string;
  name: string;
  description?: string | null;
  items: { question: ApiQuestion }[];
}

export default function BankDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [bank, setBank] = useState<BankDetail | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/banks/${id}`);
    const data = await res.json();
    setBank(data.bank ?? null);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function updateQuestion(updated: ApiQuestion) {
    setBank((b) => (b ? { ...b, items: b.items.map((i) => (i.question.id === updated.id ? { ...i, question: updated } : i)) } : b));
  }

  function onDeleted(questionId: string) {
    setBank((b) => (b ? { ...b, items: b.items.filter((i) => i.question.id !== questionId) } : b));
  }

  async function removeItem(questionId: string) {
    await fetch(`/api/banks/${id}/items?questionId=${questionId}`, { method: "DELETE" });
    setBank((b) => (b ? { ...b, items: b.items.filter((i) => i.question.id !== questionId) } : b));
  }

  async function deleteBank() {
    if (!confirm("Delete this collection? Questions themselves are not deleted.")) return;
    await fetch(`/api/banks/${id}`, { method: "DELETE" });
    router.push("/bank");
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Loading...</p>;
  if (!bank) return <p className="text-sm text-red-600">Collection not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{bank.name}</h1>
          {bank.description ? <p className="text-sm text-[var(--muted)]">{bank.description}</p> : null}
        </div>
        <button className="btn btn-ghost text-red-600" onClick={deleteBank}>
          Delete collection
        </button>
      </div>
      {bank.items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No questions in this collection yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {bank.items.map(({ question }) => (
            <QuestionCard
              key={question.id}
              question={question}
              onChange={updateQuestion}
              onRemove={onDeleted}
              extraAction={{ label: "Remove from collection", onClick: () => removeItem(question.id) }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
