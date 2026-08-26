"use client";

import { useState } from "react";
import type { ApiQuestion } from "@/lib/client/types";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";
import type { QuestionType } from "@/lib/constants";

export default function QuestionPicker({ onPick }: { onPick: (q: ApiQuestion) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiQuestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function search(q: string) {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/questions?search=${encodeURIComponent(q)}&pageSize=8`);
    const data = await res.json();
    setResults(data.questions ?? []);
    setLoading(false);
  }

  return (
    <div className="relative">
      <input
        className="input"
        placeholder="Search the question bank to add..."
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => search(e.target.value)}
      />
      {open && query.length >= 2 ? (
        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-[var(--border)] bg-white shadow-lg">
          {loading ? (
            <p className="p-2 text-xs text-[var(--muted)]">Searching...</p>
          ) : results.length === 0 ? (
            <p className="p-2 text-xs text-[var(--muted)]">No matches</p>
          ) : (
            results.map((q) => (
              <button
                key={q.id}
                type="button"
                className="block w-full border-b border-[var(--border)] p-2 text-left text-xs last:border-0 hover:bg-[#f5f6fa]"
                onClick={() => {
                  onPick(q);
                  setOpen(false);
                  setQuery("");
                  setResults([]);
                }}
              >
                <span className="badge mr-1">{QUESTION_TYPE_LABELS[q.type as QuestionType] ?? q.type}</span>
                {q.questionText.slice(0, 90)}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
