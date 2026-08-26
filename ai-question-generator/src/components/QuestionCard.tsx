"use client";

import { useState } from "react";
import { BLOOM_LEVEL_LABELS, DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from "@/lib/constants";
import type { BloomLevel, DifficultyLevel, QuestionType } from "@/lib/constants";
import type { ApiQuestion } from "@/lib/client/types";

interface Props {
  question: ApiQuestion;
  onChange?: (updated: ApiQuestion) => void;
  /** Called after the question is permanently deleted via the Delete button. */
  onRemove?: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  /** Optional non-destructive action shown alongside Delete, e.g. "Remove from collection". */
  extraAction?: { label: string; onClick: () => void };
  /** Hide the permanent Delete button (used where only extraAction should be offered). */
  hideDelete?: boolean;
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export default function QuestionCard({ question, onChange, onRemove, selectable, selected, onToggleSelect, extraAction, hideDelete }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [draftText, setDraftText] = useState(question.questionText);
  const [error, setError] = useState<string | null>(null);

  async function run(action: string, fn: () => Promise<{ question: ApiQuestion }>) {
    setBusy(action);
    setError(null);
    try {
      const data = await fn();
      onChange?.(data.question);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  async function transform(action: string, params: Record<string, unknown> = {}) {
    await run(action, () => api(`/api/questions/${question.id}/transform`, { method: "POST", body: JSON.stringify({ action, ...params }) }));
  }

  async function saveEdit() {
    await run("SAVE", () => api(`/api/questions/${question.id}`, { method: "PATCH", body: JSON.stringify({ questionText: draftText }) }));
    setEditing(false);
  }

  async function toggleFavorite() {
    await run("FAVORITE", () =>
      api(`/api/questions/${question.id}`, { method: "PATCH", body: JSON.stringify({ isFavorite: !question.isFavorite }) }),
    );
  }

  async function duplicate() {
    setBusy("DUPLICATE");
    try {
      const data = await api(`/api/questions/${question.id}/duplicate`, { method: "POST" });
      onChange?.(data.question);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Duplicate failed");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("Delete this question?")) return;
    setBusy("DELETE");
    try {
      await api(`/api/questions/${question.id}`, { method: "DELETE" });
      onRemove?.(question.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  const isMcqLike = question.type === "MCQ_SINGLE" || question.type === "CASE_BASED_MCQ";

  return (
    <div className="card space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {selectable ? (
          <input type="checkbox" checked={!!selected} onChange={() => onToggleSelect?.(question.id)} className="mr-1" />
        ) : null}
        <span className="badge">{QUESTION_TYPE_LABELS[question.type as QuestionType] ?? question.type}</span>
        {question.bloomLevel ? <span className="badge !bg-purple-50 !text-purple-700">{BLOOM_LEVEL_LABELS[question.bloomLevel as BloomLevel]}</span> : null}
        {question.difficulty ? <span className="badge !bg-orange-50 !text-orange-700">{DIFFICULTY_LABELS[question.difficulty as DifficultyLevel]}</span> : null}
        <span className="badge !bg-green-50 !text-green-700">{question.marks} mark(s)</span>
        {typeof question.qualityScore === "number" && question.qualityScore < 0.7 ? (
          <span className="badge !bg-red-50 !text-red-700" title={question.qualityIssues?.join("; ")}>
            Needs review
          </span>
        ) : null}
        <button className="ml-auto text-lg" onClick={toggleFavorite} title="Favorite" disabled={!!busy}>
          {question.isFavorite ? "★" : "☆"}
        </button>
      </div>

      {question.caseContext ? (
        <div className="rounded-md bg-[#f5f6fa] p-3 text-sm italic">{question.caseContext}</div>
      ) : null}

      {editing ? (
        <textarea className="input" rows={3} value={draftText} onChange={(e) => setDraftText(e.target.value)} />
      ) : (
        <p className="text-sm font-medium">{question.questionText}</p>
      )}

      {question.type === "MATCH_FOLLOWING" ? (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="mb-1 text-xs font-semibold text-[var(--muted)]">Column A</div>
            {question.options.map((o, i) => (
              <div key={o.id}>{i + 1}. {o.text}</div>
            ))}
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-[var(--muted)]">Column B</div>
            {question.options.map((o, i) => (
              <div key={o.id}>{String.fromCharCode(97 + i)}. {o.matchText}</div>
            ))}
          </div>
        </div>
      ) : question.options.length > 0 ? (
        <div className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
          {question.options.map((o) => (
            <div key={o.id} className={o.isCorrect && showAnswer ? "font-semibold text-green-700" : ""}>
              {o.label}. {o.text} {o.isCorrect && showAnswer ? "✓" : ""}
            </div>
          ))}
        </div>
      ) : null}

      {question.wordBank && question.wordBank.length > 0 ? (
        <p className="text-xs italic text-[var(--muted)]">Word bank: {question.wordBank.join(", ")}</p>
      ) : null}

      {(question.answerText || question.explanation) && !isMcqLike ? (
        <div>
          <button className="text-xs font-medium text-[var(--primary)]" onClick={() => setShowAnswer((s) => !s)}>
            {showAnswer ? "Hide answer" : "Show answer"}
          </button>
          {showAnswer ? (
            <div className="mt-1 rounded-md bg-green-50 p-2 text-sm">
              {question.answerText ? <p><strong>Answer:</strong> {question.answerText}</p> : null}
              {question.explanation ? <p className="mt-1"><strong>Explanation:</strong> {question.explanation}</p> : null}
            </div>
          ) : null}
        </div>
      ) : isMcqLike ? (
        <button className="text-xs font-medium text-[var(--primary)]" onClick={() => setShowAnswer((s) => !s)}>
          {showAnswer ? "Hide answer" : "Show answer"}
        </button>
      ) : null}

      {question.sourceRef?.chunkId ? (
        <div>
          <button className="text-xs text-[var(--muted)] underline" onClick={() => setShowSource((s) => !s)}>
            View Source
          </button>
          {showSource ? (
            <p className="mt-1 text-xs text-[var(--muted)]">
              {question.sourceRef.section ? `Section: ${question.sourceRef.section} · ` : ""}
              {question.sourceRef.page ? `Page ${question.sourceRef.page} · ` : ""}
              chunk {question.sourceRef.chunkId.slice(0, 8)}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-1.5 border-t border-[var(--border)] pt-2 text-xs">
        {editing ? (
          <>
            <button className="btn btn-primary !px-2 !py-1" disabled={busy === "SAVE"} onClick={saveEdit}>
              Save
            </button>
            <button className="btn btn-secondary !px-2 !py-1" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button className="btn btn-secondary !px-2 !py-1" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
        <button className="btn btn-secondary !px-2 !py-1" disabled={busy === "REGENERATE"} onClick={() => transform("REGENERATE")}>
          {busy === "REGENERATE" ? "..." : "Regenerate"}
        </button>
        <button className="btn btn-secondary !px-2 !py-1" disabled={busy === "REGENERATE_SIMILAR"} onClick={() => transform("REGENERATE_SIMILAR")}>
          Similar
        </button>
        <button className="btn btn-secondary !px-2 !py-1" disabled={busy === "MAKE_EASIER"} onClick={() => transform("MAKE_EASIER")}>
          Easier
        </button>
        <button className="btn btn-secondary !px-2 !py-1" disabled={busy === "MAKE_HARDER"} onClick={() => transform("MAKE_HARDER")}>
          Harder
        </button>
        <button className="btn btn-secondary !px-2 !py-1" disabled={busy === "GENERATE_EXPLANATION"} onClick={() => transform("GENERATE_EXPLANATION")}>
          Explain
        </button>
        <button className="btn btn-secondary !px-2 !py-1" disabled={busy === "DUPLICATE"} onClick={duplicate}>
          Duplicate
        </button>
        {extraAction ? (
          <button className="btn btn-secondary !px-2 !py-1" onClick={extraAction.onClick}>
            {extraAction.label}
          </button>
        ) : null}
        {!hideDelete ? (
          <button className="btn btn-ghost !px-2 !py-1 text-red-600" disabled={busy === "DELETE"} onClick={remove}>
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}
