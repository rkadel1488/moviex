import type { Metadata } from "next";
import Link from "next/link";
import { GENRES } from "@/lib/tmdb";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Genres",
  description: "Pick a genre and browse movies of that type on MovieX.",
  alternates: { canonical: `${SITE_URL}/genres` },
};

const TILES = [
  { key: "all", label: "All Movies" },
  ...Object.entries(GENRES).map(([key, genre]) => ({ key, label: genre.label })),
  { key: "south-indian", label: "South Indian Cinema" },
];

export default function GenresPage() {
  return (
    <div className="px-6 sm:px-10 pt-28 pb-16 bg-zinc-950 min-h-full">
      <h1 className="text-2xl font-bold text-white mb-6">Genres</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {TILES.map((tile) => (
          <Link
            key={tile.key}
            href={`/browse/${tile.key}`}
            className="flex items-center justify-center text-center rounded-xl bg-gradient-to-br from-red-600/80 to-zinc-900 ring-1 ring-white/10 py-8 px-4 text-white font-semibold hover:ring-red-400/60 hover:-translate-y-0.5 transition-all"
          >
            {tile.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
