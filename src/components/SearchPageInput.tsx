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

export default function SearchPageInput({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
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
    setSuggestions([]);
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };

  return (
    <div ref={containerRef} className="relative mb-6">
      <form
        onSubmit={submit}
        className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-3 ring-1 ring-white/10"
      >
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
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto bg-white text-black rounded-md shadow-2xl ring-1 ring-black/10 z-50">
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
