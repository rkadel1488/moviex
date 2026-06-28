"use client";

import { useEffect, useState } from "react";
import {
  ContinueWatchingEntry,
  getContinueWatching,
  getRecentlyWatched,
  WatchEntry,
} from "@/lib/watchHistory";
import MovieRow, { RowMovie } from "@/components/MovieRow";

function toRowMovies(entries: WatchEntry[]): RowMovie[] {
  return entries.map((e) => ({
    id: e.id,
    title: e.title,
    poster_path: e.poster_path,
    vote_average: e.vote_average,
  }));
}

function toContinueWatchingRowMovies(entries: ContinueWatchingEntry[]): RowMovie[] {
  return entries.map((e) => ({
    id: e.id,
    title: e.title,
    poster_path: e.poster_path,
    vote_average: e.vote_average,
    progressPercent: e.progressPercent,
  }));
}

export default function HistoryRows() {
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingEntry[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<WatchEntry[]>([]);

  useEffect(() => {
    // syncing from localStorage, an external system, after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContinueWatching(getContinueWatching(15));
    setRecentlyWatched(getRecentlyWatched(15));
  }, []);

  return (
    <>
      {continueWatching.length > 0 && (
        <MovieRow title="Continue Watching" movies={toContinueWatchingRowMovies(continueWatching)} />
      )}
      {recentlyWatched.length > 0 && (
        <MovieRow title="Recently Watched" movies={toRowMovies(recentlyWatched)} />
      )}
    </>
  );
}
