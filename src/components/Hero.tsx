"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TmdbMovie, tmdbImageUrl } from "@/lib/tmdb";

const ROTATE_INTERVAL_MS = 7000;

export default function Hero({ movies }: { movies: TmdbMovie[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (movies.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % movies.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [movies.length]);

  const movie = movies[index];
  const backdrop = tmdbImageUrl(movie.backdrop_path, "original");

  return (
    <div className="relative w-full h-[56vw] max-h-[60vh] sm:max-h-[80vh] min-h-[340px] sm:min-h-[420px] overflow-hidden">
      {backdrop && (
        <Image
          key={movie.id}
          src={backdrop}
          alt={movie.title}
          fill
          priority
          sizes="100vw"
          className="object-cover animate-[fadeIn_0.8s_ease-in-out]"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent" />

      <div className="absolute bottom-0 left-0 inset-x-0 sm:inset-x-auto px-6 sm:px-10 pb-8 sm:pb-16 sm:max-w-2xl">
        <h1 className="text-2xl sm:text-5xl font-bold text-white drop-shadow-lg mb-3 sm:mb-4 line-clamp-2">
          {movie.title}
        </h1>
        <p className="hidden sm:block text-white/85 text-base leading-relaxed line-clamp-3 mb-6 drop-shadow">
          {movie.overview}
        </p>
        <div className="flex items-center gap-3">
          <Link
            href={`/movie/${movie.id}`}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white text-black font-semibold px-6 py-2.5 rounded-md hover:bg-white/85 transition-colors"
          >
            ▶ Play
          </Link>
          <Link
            href={`/movie/${movie.id}`}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white/20 text-white font-semibold px-6 py-2.5 rounded-md hover:bg-white/30 transition-colors backdrop-blur-sm"
          >
            ℹ More Info
          </Link>
        </div>
        {movies.length > 1 && (
          <div className="flex gap-1.5 mt-6">
            {movies.map((m, i) => (
              <button
                key={m.id}
                type="button"
                aria-label={`Show ${m.title}`}
                onClick={() => setIndex(i)}
                className={`h-1 rounded-full transition-all ${
                  i === index ? "w-8 bg-white" : "w-4 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
