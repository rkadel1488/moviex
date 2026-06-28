"use client";

import { useEffect, useState } from "react";
import { isInWatchlist, toggleWatchlist } from "@/lib/watchlist";

export default function WatchlistButton({
  id,
  title,
  poster_path,
  vote_average,
}: {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
}) {
  const [inList, setInList] = useState(false);

  useEffect(() => {
    // syncing from localStorage, an external system, after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInList(isInWatchlist(id));
  }, [id]);

  return (
    <button
      type="button"
      onClick={() => setInList(toggleWatchlist({ id, title, poster_path, vote_average }))}
      aria-pressed={inList}
      className={`flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-md transition-colors ring-1 ${
        inList
          ? "bg-white/20 text-white ring-white/30 hover:bg-white/25"
          : "bg-transparent text-white ring-white/40 hover:bg-white/10"
      }`}
    >
      {inList ? "✓ In My List" : "+ Add to My List"}
    </button>
  );
}
