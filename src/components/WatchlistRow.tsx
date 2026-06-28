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

export default function WatchlistRow() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);

  useEffect(() => {
    // syncing from localStorage, an external system, after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWatchlist(getWatchlist());
  }, []);

  if (watchlist.length === 0) return null;

  return <MovieRow title="My List" movies={toRowMovies(watchlist)} />;
}
