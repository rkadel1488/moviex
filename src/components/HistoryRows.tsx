"use client";

import { useEffect, useState } from "react";
import { getRecentlyWatched, WatchEntry } from "@/lib/watchHistory";
import MovieRow, { RowMovie } from "@/components/MovieRow";

function toRowMovies(entries: WatchEntry[]): RowMovie[] {
  return entries.map((e) => ({
    id: e.id,
    title: e.title,
    poster_path: e.poster_path,
    vote_average: e.vote_average,
  }));
}

export default function HistoryRows() {
  const [recentlyWatched, setRecentlyWatched] = useState<WatchEntry[]>([]);

  useEffect(() => {
    // syncing from localStorage, an external system, after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentlyWatched(getRecentlyWatched(15));
  }, []);

  if (recentlyWatched.length === 0) return null;

  return <MovieRow title="Recently Watched" movies={toRowMovies(recentlyWatched)} />;
}
