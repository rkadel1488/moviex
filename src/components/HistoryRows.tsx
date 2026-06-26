"use client";

import { useEffect, useState } from "react";
import { getContinueWatching, getRecentlyWatched, WatchEntry } from "@/lib/watchHistory";
import MovieRow, { RowMovie } from "@/components/MovieRow";

function fakeProgress(id: number): number {
  return 25 + (id % 70);
}

function toRowMovies(entries: WatchEntry[], withProgress: boolean): RowMovie[] {
  return entries.map((e) => ({
    id: e.id,
    title: e.title,
    poster_path: e.poster_path,
    vote_average: e.vote_average,
    progressPercent: withProgress ? fakeProgress(e.id) : undefined,
  }));
}

export default function HistoryRows() {
  const [continueWatching, setContinueWatching] = useState<WatchEntry[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<WatchEntry[]>([]);

  useEffect(() => {
    // syncing from localStorage, an external system, after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContinueWatching(getContinueWatching(8));
    setRecentlyWatched(getRecentlyWatched(15));
  }, []);

  if (continueWatching.length === 0) return null;

  return (
    <>
      <MovieRow title="Continue Watching" movies={toRowMovies(continueWatching, true)} />
      <MovieRow title="Recently Watched" movies={toRowMovies(recentlyWatched, false)} />
    </>
  );
}
