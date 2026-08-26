"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DocSummary {
  id: string;
  title: string;
  sourceType: string;
  status: string;
  pageCount: number | null;
  errorMessage: string | null;
  createdAt: string;
  _count: { chunks: number; questions: number };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"TEXT" | "TOPIC" | "FILE">("TEXT");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/documents");
    const data = await res.json();
    setDocuments(data.documents ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let res: Response;
      if (mode === "FILE") {
        if (!file) throw new Error("Choose a file first");
        const form = new FormData();
        form.append("file", file);
        form.append("title", title);
        res = await fetch("/api/documents", { method: "POST", body: form });
      } else {
        res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceType: mode, title, text }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setTitle("");
      setText("");
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this document and its extracted content?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Documents</h1>

      <div className="card p-5">
        <h2 className="mb-3 font-semibold">Add learning material</h2>
        <div className="mb-3 flex gap-2">
          {(["TEXT", "TOPIC", "FILE"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`btn ${mode === m ? "btn-primary" : "btn-secondary"}`}
            >
              {m === "TEXT" ? "Paste Text" : m === "TOPIC" ? "Topic Only" : "Upload PDF / DOCX"}
            </button>
          ))}
        </div>
        <form onSubmit={onUpload} className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chapter 6 - Photosynthesis" />
          </div>
          {mode === "FILE" ? (
            <div>
              <label className="label">File (PDF or DOCX, max 15 MB)</label>
              <input
                className="input"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : (
            <div>
              <label className="label">{mode === "TOPIC" ? "Topic / learning outcome description" : "Paste content"}</label>
              <textarea className="input" rows={8} value={text} onChange={(e) => setText(e.target.value)} />
            </div>
          )}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button className="btn btn-primary" disabled={busy} type="submit">
            {busy ? "Processing..." : "Add Document"}
          </button>
        </form>
      </div>

      <div className="card p-5">
        <h2 className="mb-3 font-semibold">Your documents</h2>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Loading...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No documents yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="py-2">Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Chunks</th>
                <th>Questions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-t border-[var(--border)]">
                  <td className="py-2">{d.title}</td>
                  <td>{d.sourceType}</td>
                  <td>
                    <span
                      className={`badge ${d.status === "FAILED" ? "!bg-red-100 !text-red-700" : d.status === "PROCESSING" ? "!bg-yellow-100 !text-yellow-700" : ""}`}
                    >
                      {d.status}
                    </span>
                    {d.errorMessage ? <div className="text-xs text-red-600">{d.errorMessage}</div> : null}
                  </td>
                  <td>{d._count.chunks}</td>
                  <td>{d._count.questions}</td>
                  <td className="space-x-2 text-right">
                    <Link href={`/generate?documentId=${d.id}`} className="text-[var(--primary)] hover:underline">
                      Generate
                    </Link>
                    <button onClick={() => onDelete(d.id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
