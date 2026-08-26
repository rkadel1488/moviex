"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BLOOM_LEVELS,
  BLOOM_LEVEL_LABELS,
  CURRICULUM_PRESETS,
  DEFAULT_BLOOM_DISTRIBUTION,
  DEFAULT_DIFFICULTY_DISTRIBUTION,
  DIFFICULTY_LEVELS,
  DIFFICULTY_LABELS,
  GRADE_PRESETS,
  LANGUAGES,
} from "@/lib/constants";
import type { BloomLevel, DifficultyLevel } from "@/lib/constants";
import type { GenerationConfig, QuestionTypeRequest } from "@/lib/types";
import type { ApiQuestion } from "@/lib/client/types";
import QuestionTypePicker from "@/components/QuestionTypePicker";
import QuestionCard from "@/components/QuestionCard";

interface DocSummary {
  id: string;
  title: string;
  status: string;
}

const STEPS = ["Source", "Configure", "Generate & Review", "Finalize"];

export default function GenerateWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(0);
  const [documents, setDocuments] = useState<DocSummary[]>([]);
  const [documentId, setDocumentId] = useState<string | undefined>(searchParams.get("documentId") ?? undefined);
  const [topicOnly, setTopicOnly] = useState(false);

  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("Grade 8");
  const [board, setBoard] = useState("");
  const [chapter, setChapter] = useState("");
  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [language, setLanguage] = useState("en");

  const [questionTypes, setQuestionTypes] = useState<QuestionTypeRequest[]>([
    { type: "MCQ_SINGLE", count: 5, marksEach: 1, optionCount: 4 },
    { type: "SHORT_ANSWER", count: 3, marksEach: 3 },
  ]);

  const [difficultyMode, setDifficultyMode] = useState<"AUTO_BALANCED" | "FIXED">("AUTO_BALANCED");
  const [fixedDifficulty, setFixedDifficulty] = useState<DifficultyLevel>("MODERATE");
  const [bloomMode, setBloomMode] = useState<"AUTO_BALANCED" | "MANUAL">("AUTO_BALANCED");
  const [selectedBloom, setSelectedBloom] = useState<BloomLevel[]>(["UNDERSTAND", "APPLY"]);

  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [includeMarkingScheme, setIncludeMarkingScheme] = useState(false);
  const [includeRubric, setIncludeRubric] = useState(false);
  const [avoidDuplicates, setAvoidDuplicates] = useState(true);
  const [randomizeOptions, setRandomizeOptions] = useState(true);
  const [sourceOnly, setSourceOnly] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [finalizeBusy, setFinalizeBusy] = useState(false);
  const [finalizeMessage, setFinalizeMessage] = useState<string | null>(null);
  const [bankName, setBankName] = useState("");
  const [paperTitle, setPaperTitle] = useState("");

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((d) => setDocuments((d.documents ?? []).filter((doc: DocSummary) => doc.status === "READY")));
  }, []);

  const totalQuestions = useMemo(() => questionTypes.reduce((s, r) => s + r.count, 0), [questionTypes]);
  const totalMarks = useMemo(() => questionTypes.reduce((s, r) => s + r.count * r.marksEach, 0), [questionTypes]);

  function buildConfig(): GenerationConfig {
    return {
      subject,
      grade,
      board: board || undefined,
      chapter: chapter || undefined,
      topic: topic || undefined,
      subtopic: subtopic || undefined,
      language,
      questionTypes,
      totalQuestions,
      totalMarks,
      difficulty: difficultyMode === "AUTO_BALANCED" ? "AUTO_BALANCED" : fixedDifficulty,
      difficultyDistribution: difficultyMode === "AUTO_BALANCED" ? DEFAULT_DIFFICULTY_DISTRIBUTION : undefined,
      bloomLevels: bloomMode === "AUTO_BALANCED" ? "AUTO_BALANCED" : selectedBloom,
      bloomDistribution: bloomMode === "AUTO_BALANCED" ? DEFAULT_BLOOM_DISTRIBUTION : undefined,
      includeAnswers,
      includeExplanations,
      includeMarkingScheme,
      includeRubric,
      randomizeOptions,
      avoidDuplicates,
      sourceOnly: topicOnly ? false : sourceOnly,
    };
  }

  async function onGenerate() {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: topicOnly ? undefined : documentId, config: buildConfig() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setQuestions(data.questions ?? []);
      setStep(2);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  function updateQuestion(updated: ApiQuestion) {
    setQuestions((qs) => {
      const exists = qs.some((q) => q.id === updated.id);
      return exists ? qs.map((q) => (q.id === updated.id ? updated : q)) : [...qs, updated];
    });
  }

  function removeQuestion(id: string) {
    setQuestions((qs) => qs.filter((q) => q.id !== id));
    setSelected((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(questions.map((q) => q.id)));
  }

  async function saveToBank() {
    if (selected.size === 0) return setFinalizeMessage("Select at least one question first.");
    setFinalizeBusy(true);
    setFinalizeMessage(null);
    try {
      const bankRes = await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: bankName || `${subject} - ${new Date().toLocaleDateString()}` }),
      });
      const bankData = await bankRes.json();
      if (!bankRes.ok) throw new Error(bankData.error ?? "Could not create bank");
      await fetch(`/api/banks/${bankData.bank.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: Array.from(selected) }),
      });
      setFinalizeMessage(`Saved ${selected.size} question(s) to "${bankData.bank.name}".`);
    } catch (err) {
      setFinalizeMessage(err instanceof Error ? err.message : "Could not save to bank");
    } finally {
      setFinalizeBusy(false);
    }
  }

  async function createPaper() {
    if (selected.size === 0) return setFinalizeMessage("Select at least one question first.");
    setFinalizeBusy(true);
    setFinalizeMessage(null);
    try {
      const items = Array.from(selected).map((questionId, i) => ({ questionId, order: i }));
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: paperTitle || `${subject} Assessment`,
          meta: { subject, grade, fullMarks: totalMarks },
          sections: [{ title: "SECTION A", order: 0, items }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create paper");
      router.push(`/papers/${data.paper.id}`);
    } catch (err) {
      setFinalizeMessage(err instanceof Error ? err.message : "Could not create paper");
      setFinalizeBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Generate Questions</h1>

      <div className="flex gap-2 text-sm">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => i <= step && setStep(i)}
            className={`rounded-full px-3 py-1 ${i === step ? "bg-[var(--primary)] text-white" : i < step ? "bg-[#e0e4ff] text-[var(--primary)]" : "bg-[#eee] text-[var(--muted)]"}`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {step === 0 ? (
        <div className="card space-y-4 p-5">
          <h2 className="font-semibold">Choose your source material</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={topicOnly} onChange={(e) => setTopicOnly(e.target.checked)} />
            Generate from topic/subject only (no document, general knowledge allowed)
          </label>
          {!topicOnly ? (
            <div>
              <label className="label">Document</label>
              <select className="input" value={documentId ?? ""} onChange={(e) => setDocumentId(e.target.value || undefined)}>
                <option value="">Select a document...</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Don&apos;t see your material?{" "}
                <a href="/documents" className="text-[var(--primary)] underline">
                  Upload it here
                </a>
                .
              </p>
            </div>
          ) : null}
          <button className="btn btn-primary" disabled={!topicOnly && !documentId} onClick={() => setStep(1)}>
            Next: Configure
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="card space-y-5 p-5">
          <h2 className="font-semibold">Question settings</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Subject</label>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Biology" />
            </div>
            <div>
              <label className="label">Grade / Level</label>
              <input className="input" list="grade-presets" value={grade} onChange={(e) => setGrade(e.target.value)} />
              <datalist id="grade-presets">
                {GRADE_PRESETS.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="label">Curriculum / Board</label>
              <input className="input" list="curriculum-presets" value={board} onChange={(e) => setBoard(e.target.value)} />
              <datalist id="curriculum-presets">
                {CURRICULUM_PRESETS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="label">Language</label>
              <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Chapter</label>
              <input className="input" value={chapter} onChange={(e) => setChapter(e.target.value)} />
            </div>
            <div>
              <label className="label">Topic</label>
              <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </div>
            <div>
              <label className="label">Subtopic</label>
              <input className="input" value={subtopic} onChange={(e) => setSubtopic(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Question types & distribution</label>
            <QuestionTypePicker value={questionTypes} onChange={setQuestionTypes} />
            <p className="mt-2 text-xs text-[var(--muted)]">
              Total: {totalQuestions} question(s), {totalMarks} marks
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Difficulty</label>
              <div className="flex gap-2">
                <select
                  className="input"
                  value={difficultyMode === "AUTO_BALANCED" ? "AUTO_BALANCED" : fixedDifficulty}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "AUTO_BALANCED") setDifficultyMode("AUTO_BALANCED");
                    else {
                      setDifficultyMode("FIXED");
                      setFixedDifficulty(v as DifficultyLevel);
                    }
                  }}
                >
                  <option value="AUTO_BALANCED">Auto Balanced</option>
                  {DIFFICULTY_LEVELS.map((d) => (
                    <option key={d} value={d}>
                      {DIFFICULTY_LABELS[d]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Bloom&apos;s Taxonomy</label>
              <select
                className="input"
                value={bloomMode}
                onChange={(e) => setBloomMode(e.target.value as "AUTO_BALANCED" | "MANUAL")}
              >
                <option value="AUTO_BALANCED">Auto Balanced (all levels)</option>
                <option value="MANUAL">Choose levels</option>
              </select>
              {bloomMode === "MANUAL" ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {BLOOM_LEVELS.map((b) => (
                    <label key={b} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedBloom.includes(b)}
                        onChange={(e) =>
                          setSelectedBloom((prev) => (e.target.checked ? [...prev, b] : prev.filter((x) => x !== b)))
                        }
                      />
                      {BLOOM_LEVEL_LABELS[b]}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeAnswers} onChange={(e) => setIncludeAnswers(e.target.checked)} /> Include answers
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeExplanations} onChange={(e) => setIncludeExplanations(e.target.checked)} /> Include explanations
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeMarkingScheme} onChange={(e) => setIncludeMarkingScheme(e.target.checked)} /> Marking scheme
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeRubric} onChange={(e) => setIncludeRubric(e.target.checked)} /> Rubric
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={randomizeOptions} onChange={(e) => setRandomizeOptions(e.target.checked)} /> Randomize MCQ options
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={avoidDuplicates} onChange={(e) => setAvoidDuplicates(e.target.checked)} /> Avoid duplicates
            </label>
            {!topicOnly ? (
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={sourceOnly} onChange={(e) => setSourceOnly(e.target.checked)} /> Use source material only
              </label>
            ) : null}
          </div>

          <div className="flex justify-between">
            <button className="btn btn-secondary" onClick={() => setStep(0)}>
              Back
            </button>
            <button className="btn btn-primary" disabled={!subject || !grade || questionTypes.length === 0 || generating} onClick={onGenerate}>
              {generating ? "Generating..." : `Generate ${totalQuestions} Questions`}
            </button>
          </div>
          {genError ? <p className="text-sm text-red-600">{genError}</p> : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[var(--muted)]">
              {questions.length} question(s) generated
              {questions.length < totalQuestions ? ` (requested ${totalQuestions} — some were dropped by quality/duplicate checks)` : ""}
            </p>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={selectAll}>
                Select all
              </button>
              <button className="btn btn-primary" onClick={() => setStep(3)} disabled={selected.size === 0}>
                Finalize ({selected.size} selected)
              </button>
            </div>
          </div>
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
        </div>
      ) : null}

      {step === 3 ? (
        <div className="card space-y-6 p-5">
          <h2 className="font-semibold">Finalize — {selected.size} question(s) selected</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-md border border-[var(--border)] p-4">
              <h3 className="font-medium">Save to Question Bank</h3>
              <input className="input" placeholder="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              <button className="btn btn-primary w-full" disabled={finalizeBusy} onClick={saveToBank}>
                Save to Bank
              </button>
            </div>
            <div className="space-y-2 rounded-md border border-[var(--border)] p-4">
              <h3 className="font-medium">Create Question Paper</h3>
              <input className="input" placeholder="Paper title" value={paperTitle} onChange={(e) => setPaperTitle(e.target.value)} />
              <button className="btn btn-primary w-full" disabled={finalizeBusy} onClick={createPaper}>
                Create Paper &amp; Continue
              </button>
            </div>
          </div>
          {finalizeMessage ? <p className="text-sm">{finalizeMessage}</p> : null}
          <button className="btn btn-secondary" onClick={() => setStep(2)}>
            Back to review
          </button>
        </div>
      ) : null}
    </div>
  );
}
