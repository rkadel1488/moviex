"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, organizationName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="mb-1 text-xl font-bold text-[var(--primary)]">Create your workspace</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">For teachers, schools & training organizations.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Your name</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">School / Organization name</label>
            <input
              className="input"
              placeholder="Optional"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button className="btn btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link className="font-medium text-[var(--primary)]" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
