"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { TmdbSeries, tmdbImageUrl } from "@/lib/tmdb";

export type RowSeries = Pick<TmdbSeries, "id" | "name" | "poster_path" | "vote_average">;

export default function SeriesRow({
  title,
  series,
}: {
  title: string;
  series: RowSeries[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (series.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="mb-10">
      {title && (
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 px-6 sm:px-10">
          {title}
        </h2>
      )}

      <div className="group/row relative">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll("left")}
          className="hidden sm:flex absolute left-0 top-0 bottom-2 z-20 w-12 items-center justify-center bg-gradient-to-r from-black/80 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <span className="text-white text-3xl">‹</span>
        </button>

        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto scroll-smooth px-6 sm:px-10 pb-2 [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch] [touch-action:pan-x] [overscroll-behavior-x:contain]"
        >
          {series.map((show) => {
            const poster = tmdbImageUrl(show.poster_path, "w500");
            return (
              <Link
                key={show.id}
                href={`/series/${show.id}`}
                className="group relative shrink-0 w-[140px] sm:w-[180px] aspect-[2/3] rounded-md overflow-hidden bg-zinc-800 ring-1 ring-white/5 transition-transform duration-200 sm:hover:scale-105 sm:hover:ring-red-500/60 sm:hover:z-10"
              >
                {poster ? (
                  <Image
                    src={poster}
                    alt={show.name}
                    fill
                    sizes="(min-width: 640px) 180px, 140px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30 text-xs text-center px-2">
                    No image
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs font-medium text-white line-clamp-2">{show.name}</p>
                  <p className="text-xs text-yellow-400 mt-0.5">★ {show.vote_average.toFixed(1)}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll("right")}
          className="hidden sm:flex absolute right-0 top-0 bottom-2 z-20 w-12 items-center justify-center bg-gradient-to-l from-black/80 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <span className="text-white text-3xl">›</span>
        </button>
      </div>
    </div>
  );
}
