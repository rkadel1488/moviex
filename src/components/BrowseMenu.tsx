"use client";

import Link from "next/link";
import { useState } from "react";
import { GENRES } from "@/lib/tmdb";

export default function BrowseMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="text-white/80 hover:text-red-400 transition-colors flex items-center gap-1"
      >
        Browse <span className="text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-black/95 backdrop-blur-md ring-1 ring-white/10 rounded-md shadow-xl py-2 z-40">
          <Link
            href="/browse/all"
            className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            All
          </Link>
          {Object.entries(GENRES).map(([key, genre]) => (
            <Link
              key={key}
              href={`/browse/${key}`}
              className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              {genre.label}
            </Link>
          ))}
          <Link
            href="/browse/south-indian"
            className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            South Indian Cinema
          </Link>
          <div className="my-1 border-t border-white/10" />
          <Link
            href="/genres"
            className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            All Genres
          </Link>
        </div>
      )}
    </div>
  );
}
