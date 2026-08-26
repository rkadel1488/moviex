"use client";

import { useEffect, useState, use } from "react";
import type { ApiQuestion } from "@/lib/client/types";
import { PAPER_TEMPLATES, PAPER_TEMPLATE_LABELS } from "@/lib/constants";
import type { PaperTemplate } from "@/lib/constants";
import QuestionPicker from "./QuestionPicker";

interface LocalItem {
  key: string;
  questionId: string;
  marksOverride?: number;
  isOptional: boolean;
  question: ApiQuestion;
}

interface LocalSection {
  key: string;
  title: string;
  instructions: string;
  items: LocalItem[];
}

interface PaperMeta {
  schoolName?: string;
  examName?: string;
  academicSession?: string;
  subject?: string;
  grade?: string;
  date?: string;
  time?: string;
  fullMarks?: number;
  passMarks?: number;
  instructions?: string[];
}

let keyCounter = 0;
const nextKey = () => `k${keyCounter++}`;

export default function PaperBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [title, setTitle] = useState("");
  const [templateStyle, setTemplateStyle] = useState<PaperTemplate>("SCHOOL_EXAM");
  const [meta, setMeta] = useState<PaperMeta>({});
  const [sections, setSections] = useState<LocalSection[]>([]);
  const [instructionsText, setInstructionsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/papers/${id}`);
    const data = await res.json();
    const paper = data.paper;
    setTitle(paper.title);
    setTemplateStyle(paper.templateStyle);
    setMeta(paper.meta ?? {});
    setInstructionsText((paper.meta?.instructions ?? []).join("\n"));
    setSections(
      [...paper.sections]
        .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
        .map((s: { title: string; instructions: string | null; items: { questionId: string; marksOverride: number | null; isOptional: boolean; question: ApiQuestion; order: number }[] }) => ({
          key: nextKey(),
          title: s.title,
          instructions: s.instructions ?? "",
          items: [...s.items]
            .sort((a, b) => a.order - b.order)
            .map((i) => ({ key: nextKey(), questionId: i.questionId, marksOverride: i.marksOverride ?? undefined, isOptional: i.isOptional, question: i.question })),
        })),
    );
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totalMarks = sections.reduce(
    (sum, s) => sum + s.items.reduce((sSum, i) => sSum + (i.marksOverride ?? i.question.marks), 0),
    0,
  );
  const totalQuestions = sections.reduce((sum, s) => sum + s.items.length, 0);

  function addSection() {
    setSections((s) => [...s, { key: nextKey(), title: `SECTION ${String.fromCharCode(65 + s.length)}`, instructions: "", items: [] }]);
  }

  function removeSection(key: string) {
    setSections((s) => s.filter((sec) => sec.key !== key));
  }

  function updateSection(key: string, patch: Partial<LocalSection>) {
    setSections((s) => s.map((sec) => (sec.key === key ? { ...sec, ...patch } : sec)));
  }

  function moveSection(index: number, dir: -1 | 1) {
    setSections((s) => {
      const next = [...s];
      const target = index + dir;
      if (target < 0 || target >= next.length) return s;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addQuestion(sectionKey: string, question: ApiQuestion) {
    setSections((s) =>
      s.map((sec) =>
        sec.key === sectionKey
          ? sec.items.some((i) => i.questionId === question.id)
            ? sec
            : { ...sec, items: [...sec.items, { key: nextKey(), questionId: question.id, isOptional: false, question }] }
          : sec,
      ),
    );
  }

  function removeItem(sectionKey: string, itemKey: string) {
    setSections((s) => s.map((sec) => (sec.key === sectionKey ? { ...sec, items: sec.items.filter((i) => i.key !== itemKey) } : sec)));
  }

  function updateItem(sectionKey: string, itemKey: string, patch: Partial<LocalItem>) {
    setSections((s) =>
      s.map((sec) =>
        sec.key === sectionKey ? { ...sec, items: sec.items.map((i) => (i.key === itemKey ? { ...i, ...patch } : i)) } : sec,
      ),
    );
  }

  function moveItem(sectionKey: string, index: number, dir: -1 | 1) {
    setSections((s) =>
      s.map((sec) => {
        if (sec.key !== sectionKey) return sec;
        const next = [...sec.items];
        const target = index + dir;
        if (target < 0 || target >= next.length) return sec;
        [next[index], next[target]] = [next[target], next[index]];
        return { ...sec, items: next };
      }),
    );
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/papers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          templateStyle,
          meta: {
            ...meta,
            instructions: instructionsText.split("\n").map((l) => l.trim()).filter(Boolean),
          },
          sections: sections.map((s, si) => ({
            title: s.title,
            instructions: s.instructions || undefined,
            order: si,
            items: s.items.map((i, ii) => ({
              questionId: i.questionId,
              order: ii,
              marksOverride: i.marksOverride,
              isOptional: i.isOptional,
            })),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMessage("Saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <input className="input max-w-md text-xl font-bold" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="flex gap-2">
          <a className="btn btn-secondary" href={`/api/papers/${id}/export/pdf`}>
            Export PDF
          </a>
          <a className="btn btn-secondary" href={`/api/papers/${id}/export/docx`}>
            Export Word
          </a>
          <a className="btn btn-secondary" href={`/api/papers/${id}/export/answer-key/pdf`}>
            Answer Key (PDF)
          </a>
          <a className="btn btn-secondary" href={`/api/papers/${id}/export/answer-key/docx`}>
            Answer Key (Word)
          </a>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      <p className="text-sm text-[var(--muted)]">
        {totalQuestions} question(s) · {totalMarks} marks total
      </p>

      <div className="card space-y-3 p-5">
        <h2 className="font-semibold">Paper Formatting</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Template style</label>
            <select className="input" value={templateStyle} onChange={(e) => setTemplateStyle(e.target.value as PaperTemplate)}>
              {PAPER_TEMPLATES.map((t) => (
                <option key={t} value={t}>
                  {PAPER_TEMPLATE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">School name</label>
            <input className="input" value={meta.schoolName ?? ""} onChange={(e) => setMeta((m) => ({ ...m, schoolName: e.target.value }))} />
          </div>
          <div>
            <label className="label">Examination name</label>
            <input className="input" value={meta.examName ?? ""} onChange={(e) => setMeta((m) => ({ ...m, examName: e.target.value }))} />
          </div>
          <div>
            <label className="label">Subject</label>
            <input className="input" value={meta.subject ?? ""} onChange={(e) => setMeta((m) => ({ ...m, subject: e.target.value }))} />
          </div>
          <div>
            <label className="label">Grade</label>
            <input className="input" value={meta.grade ?? ""} onChange={(e) => setMeta((m) => ({ ...m, grade: e.target.value }))} />
          </div>
          <div>
            <label className="label">Academic session</label>
            <input className="input" value={meta.academicSession ?? ""} onChange={(e) => setMeta((m) => ({ ...m, academicSession: e.target.value }))} />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" value={meta.date ?? ""} onChange={(e) => setMeta((m) => ({ ...m, date: e.target.value }))} />
          </div>
          <div>
            <label className="label">Time</label>
            <input className="input" value={meta.time ?? ""} onChange={(e) => setMeta((m) => ({ ...m, time: e.target.value }))} />
          </div>
          <div>
            <label className="label">Full marks</label>
            <input
              className="input"
              type="number"
              value={meta.fullMarks ?? totalMarks}
              onChange={(e) => setMeta((m) => ({ ...m, fullMarks: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="label">Pass marks</label>
            <input
              className="input"
              type="number"
              value={meta.passMarks ?? ""}
              onChange={(e) => setMeta((m) => ({ ...m, passMarks: Number(e.target.value) }))}
            />
          </div>
        </div>
        <div>
          <label className="label">General instructions (one per line)</label>
          <textarea className="input" rows={3} value={instructionsText} onChange={(e) => setInstructionsText(e.target.value)} />
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section, si) => (
          <div key={section.key} className="card space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="input max-w-xs font-semibold"
                value={section.title}
                onChange={(e) => updateSection(section.key, { title: e.target.value })}
              />
              <span className="text-xs text-[var(--muted)]">
                {section.items.length} question(s) ·{" "}
                {section.items.reduce((s, i) => s + (i.marksOverride ?? i.question.marks), 0)} marks
              </span>
              <div className="ml-auto flex gap-1">
                <button className="btn btn-ghost !px-2 !py-1" onClick={() => moveSection(si, -1)}>
                  ↑
                </button>
                <button className="btn btn-ghost !px-2 !py-1" onClick={() => moveSection(si, 1)}>
                  ↓
                </button>
                <button className="btn btn-ghost !px-2 !py-1 text-red-600" onClick={() => removeSection(section.key)}>
                  Remove section
                </button>
              </div>
            </div>
            <input
              className="input"
              placeholder="Section instructions (optional)"
              value={section.instructions}
              onChange={(e) => updateSection(section.key, { instructions: e.target.value })}
            />

            <div className="space-y-2">
              {section.items.map((item, ii) => (
                <div key={item.key} className="flex items-start gap-2 rounded-md border border-[var(--border)] p-2 text-sm">
                  <span className="mt-1 w-6 text-xs text-[var(--muted)]">Q{ii + 1}</span>
                  <div className="flex-1">
                    <p>{item.question.questionText}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                      <label className="flex items-center gap-1">
                        Marks
                        <input
                          type="number"
                          className="input !w-16 !py-0.5"
                          value={item.marksOverride ?? item.question.marks}
                          onChange={(e) => updateItem(section.key, item.key, { marksOverride: Number(e.target.value) })}
                        />
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={item.isOptional}
                          onChange={(e) => updateItem(section.key, item.key, { isOptional: e.target.checked })}
                        />
                        Optional / OR question
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button className="btn btn-ghost !px-2 !py-0.5" onClick={() => moveItem(section.key, ii, -1)}>
                      ↑
                    </button>
                    <button className="btn btn-ghost !px-2 !py-0.5" onClick={() => moveItem(section.key, ii, 1)}>
                      ↓
                    </button>
                    <button className="btn btn-ghost !px-2 !py-0.5 text-red-600" onClick={() => removeItem(section.key, item.key)}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <QuestionPicker onPick={(q) => addQuestion(section.key, q)} />
          </div>
        ))}
      </div>

      <button className="btn btn-secondary" onClick={addSection}>
        + Add Section
      </button>
    </div>
  );
}
