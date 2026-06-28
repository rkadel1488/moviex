"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchPageInput({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-3 mb-6 ring-1 ring-white/10">
      <span className="text-white/50">🔍</span>
      <input
        autoFocus
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a movie..."
        className="flex-1 bg-transparent text-white placeholder-white/40 outline-none"
      />
    </form>
  );
}
