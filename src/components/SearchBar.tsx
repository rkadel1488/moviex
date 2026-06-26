"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { tmdbImageUrl } from "@/lib/tmdb";

interface Suggestion {
  id: number;
  title: string;
  poster_path: string | null;
  year: string | null;
}

export default function SearchBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setSuggestions(data.results ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setSuggestions([]);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div ref={containerRef} className="relative">
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
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              if (!value.trim()) setSuggestions([]);
            }}
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
      {open && suggestions.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white text-black rounded-md shadow-2xl ring-1 ring-black/10 z-50">
          {suggestions.map((movie) => {
            const poster = tmdbImageUrl(movie.poster_path, "w200");
            return (
              <Link
                key={movie.id}
                href={`/movie/${movie.id}`}
                onClick={() => setSuggestions([])}
                className="flex items-center gap-3 px-3 py-2 border-b border-black/5 last:border-b-0 hover:bg-black/5 transition-colors"
              >
                <div className="w-8 h-11 shrink-0 rounded overflow-hidden bg-zinc-200 flex items-center justify-center">
                  {poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={poster} alt={movie.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[8px] text-zinc-400">N/A</span>
                  )}
                </div>
                <p className="text-sm font-medium leading-snug">
                  {movie.title}
                  {movie.year && ` (${movie.year})`}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
