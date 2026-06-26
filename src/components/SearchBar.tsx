"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form
      onSubmit={submit}
      className={`flex items-center gap-2 transition-all ${
        open ? "bg-black/70 ring-1 ring-white/20 rounded-md px-2" : ""
      }`}
    >
      {open && (
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => !query && setOpen(false)}
          placeholder="Titles..."
          className="bg-transparent text-white text-sm placeholder-white/50 outline-none py-1.5 w-36 sm:w-48"
        />
      )}
      <button
        type={open ? "submit" : "button"}
        aria-label="Search"
        onClick={() => !open && setOpen(true)}
        className="text-white/80 hover:text-red-400 transition-colors p-1"
      >
        🔍
      </button>
    </form>
  );
}
