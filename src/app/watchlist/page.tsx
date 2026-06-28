"use client";

import { useEffect, useState } from "react";
import { getWatchlist, WatchlistEntry } from "@/lib/watchlist";
import MovieRow, { RowMovie } from "@/components/MovieRow";

function toRowMovies(entries: WatchlistEntry[]): RowMovie[] {
  return entries.map((e) => ({
    id: e.id,
    title: e.title,
    poster_path: e.poster_path,
    vote_average: e.vote_average,
  }));
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[] | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWatchlist(getWatchlist());
  }, []);

  return (
    <div className="pt-28 pb-16 bg-zinc-950 min-h-full">
      <h1 className="text-2xl font-bold text-white mb-6 px-6 sm:px-10">My List</h1>
      {watchlist && watchlist.length === 0 && (
        <p className="px-6 sm:px-10 text-white/40 text-sm">
          Your list is empty. Tap &quot;+ Add to My List&quot; on any movie to save it here.
        </p>
      )}
      {watchlist && watchlist.length > 0 && (
        <MovieRow title="" movies={toRowMovies(watchlist)} />
      )}
    </div>
  );
}
