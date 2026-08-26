"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BLOOM_LEVELS,
  BLOOM_LEVEL_LABELS,
  DIFFICULTY_LEVELS,
  DIFFICULTY_LABELS,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
} from "@/lib/constants";
import type { ApiQuestion } from "@/lib/client/types";
import QuestionCard from "@/components/QuestionCard";

interface Taxonomy {
  subjects: { id: string; name: string }[];
  grades: { id: string; name: string }[];
}

interface BankSummary {
  id: string;
  name: string;
  _count: { items: number };
}

export default function BankPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"ALL" | "COLLECTIONS">("ALL");
  const [taxonomy, setTaxonomy] = useState<Taxonomy>({ subjects: [], grades: [] });
  const [banks, setBanks] = useState<BankSummary[]>([]);

  const [filters, setFilters] = useState({ subjectId: "", gradeId: "", type: "", difficulty: "", bloomLevel: "", favorite: "", search: "" });
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/taxonomy").then((r) => r.json()).then(setTaxonomy);
    fetch("/api/banks").then((r) => r.json()).then((d) => setBanks(d.banks ?? []));
  }, []);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const res = await fetch(`/api/questions?${params.toString()}`);
    const data = await res.json();
    setQuestions(data.questions ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function toggleSelect(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateQuestion(updated: ApiQuestion) {
    setQuestions((qs) => qs.map((q) => (q.id === updated.id ? updated : q)));
  }

  function removeQuestion(id: string) {
    setQuestions((qs) => qs.filter((q) => q.id !== id));
  }

  async function addSelectedToBank(bankId: string) {
    if (selected.size === 0) return;
    await fetch(`/api/banks/${bankId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionIds: Array.from(selected) }),
    });
    setMessage(`Added ${selected.size} question(s) to bank.`);
  }

  async function createPaperFromSelected() {
    if (selected.size === 0) return;
    const items = Array.from(selected).map((questionId, i) => ({ questionId, order: i }));
    const res = await fetch("/api/papers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Question Paper", sections: [{ title: "SECTION A", order: 0, items }] }),
    });
    const data = await res.json();
    if (res.ok) router.push(`/papers/${data.paper.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <div className="flex gap-2">
          <button className={`btn ${tab === "ALL" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("ALL")}>
            All Questions
          </button>
          <button className={`btn ${tab === "COLLECTIONS" ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab("COLLECTIONS")}>
            Collections
          </button>
        </div>
      </div>

      {tab === "COLLECTIONS" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {banks.map((b) => (
            <Link key={b.id} href={`/bank/${b.id}`} className="card p-4 hover:border-[var(--primary)]">
              <div className="font-semibold">{b.name}</div>
              <div className="text-xs text-[var(--muted)]">{b._count.items} question(s)</div>
            </Link>
          ))}
          {banks.length === 0 ? <p className="text-sm text-[var(--muted)]">No collections yet. Save questions from the generator or from here.</p> : null}
        </div>
      ) : (
        <>
          <div className="card grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 lg:grid-cols-6">
            <select className="input" value={filters.subjectId} onChange={(e) => setFilters((f) => ({ ...f, subjectId: e.target.value }))}>
              <option value="">All subjects</option>
              {taxonomy.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select className="input" value={filters.gradeId} onChange={(e) => setFilters((f) => ({ ...f, gradeId: e.target.value }))}>
              <option value="">All grades</option>
              {taxonomy.grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <select className="input" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
              <option value="">All types</option>
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {QUESTION_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <select className="input" value={filters.difficulty} onChange={(e) => setFilters((f) => ({ ...f, difficulty: e.target.value }))}>
              <option value="">All difficulties</option>
              {DIFFICULTY_LEVELS.map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </select>
            <select className="input" value={filters.bloomLevel} onChange={(e) => setFilters((f) => ({ ...f, bloomLevel: e.target.value }))}>
              <option value="">All Bloom levels</option>
              {BLOOM_LEVELS.map((b) => (
                <option key={b} value={b}>
                  {BLOOM_LEVEL_LABELS[b]}
                </option>
              ))}
            </select>
            <input
              className="input"
              placeholder="Search text..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[var(--muted)]">
              {total} question(s) · {selected.size} selected
            </p>
            <div className="flex flex-wrap gap-2">
              <select
                className="input !w-auto"
                onChange={(e) => e.target.value && addSelectedToBank(e.target.value)}
                value=""
              >
                <option value="">Add selected to collection...</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <button className="btn btn-secondary" onClick={createPaperFromSelected} disabled={selected.size === 0}>
                Create Paper from Selected
              </button>
            </div>
          </div>
          {message ? <p className="text-sm text-green-700">{message}</p> : null}

          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading...</p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No questions match these filters yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  onChange={updateQuestion}
                  onRemove={removeQuestion}
                  selectable
                  selected={selected.has(q.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
