"use client";

import { useState } from "react";
import { TmdbSeasonSummary, TmdbEpisode } from "@/lib/tmdb";
import { getSeriesEmbedUrl } from "@/lib/embed";

export default function EpisodePicker({
  seriesId,
  seasons,
  initialSeason,
  initialEpisodes,
}: {
  seriesId: string;
  seasons: TmdbSeasonSummary[];
  initialSeason: number;
  initialEpisodes: TmdbEpisode[];
}) {
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [episodes, setEpisodes] = useState<TmdbEpisode[]>(initialEpisodes);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const embedUrl = getSeriesEmbedUrl(seriesId, selectedSeason, selectedEpisode);

  async function switchSeason(seasonNumber: number) {
    if (seasonNumber === selectedSeason) return;
    setSelectedSeason(seasonNumber);
    setSelectedEpisode(1);
    setLoadingEpisodes(true);
    try {
      const res = await fetch(`/api/season?id=${seriesId}&season=${seasonNumber}`);
      if (res.ok) {
        const data = await res.json();
        setEpisodes(data.episodes ?? []);
      }
    } finally {
      setLoadingEpisodes(false);
    }
  }

  const playableSeasons = seasons.filter((s) => s.season_number > 0);

  return (
    <div>
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black ring-1 ring-white/10 shadow-2xl shadow-black/50">
        <iframe
          key={`${selectedSeason}-${selectedEpisode}`}
          src={embedUrl}
          className="w-full h-full"
          allowFullScreen
          referrerPolicy="no-referrer"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        />
      </div>

      <div className="mt-6">
        {playableSeasons.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {playableSeasons.map((s) => (
              <button
                key={s.season_number}
                type="button"
                onClick={() => switchSeason(s.season_number)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedSeason === s.season_number
                    ? "bg-red-600 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {loadingEpisodes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-white/20">
            {episodes.map((ep) => (
              <button
                key={ep.episode_number}
                type="button"
                onClick={() => setSelectedEpisode(ep.episode_number)}
                className={`flex items-center gap-3 text-left px-3 py-2.5 rounded-lg transition-colors ${
                  selectedEpisode === ep.episode_number
                    ? "bg-red-600/30 ring-1 ring-red-500/50 text-white"
                    : "bg-white/5 hover:bg-white/10 text-white/70"
                }`}
              >
                <span className="shrink-0 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                  {ep.episode_number}
                </span>
                <span className="text-sm line-clamp-1">{ep.name || `Episode ${ep.episode_number}`}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
