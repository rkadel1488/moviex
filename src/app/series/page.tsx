import {
  getSeriesAcrossPages,
  getTrendingSeries,
  getPopularSeries,
  getTopRatedSeries,
  getOnTheAirSeries,
  getSeriesByGenre,
  getHindiSeries,
} from "@/lib/tmdb";
import SeriesRow from "@/components/SeriesRow";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Web Series",
  description: "Watch trending, popular, and top-rated web series online on MovieX.",
};

function dedupeAgainst<T extends { id: number }>(items: T[], seen: Set<number>, limit = 20): T[] {
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

export default async function SeriesPage() {
  const [trendingPool, popularPool, topRatedPool, onAirPool, hindiPool, dramaPool, crimePool, scifiPool, animationPool] =
    await Promise.all([
      getSeriesAcrossPages(getTrendingSeries),
      getSeriesAcrossPages(getPopularSeries),
      getSeriesAcrossPages(getTopRatedSeries),
      getSeriesAcrossPages(getOnTheAirSeries).catch(() => [] as Awaited<ReturnType<typeof getOnTheAirSeries>>),
      getSeriesAcrossPages(getHindiSeries),
      getSeriesAcrossPages((page) => getSeriesByGenre(18, page)),  // Drama
      getSeriesAcrossPages((page) => getSeriesByGenre(80, page)),  // Crime
      getSeriesAcrossPages((page) => getSeriesByGenre(10765, page)), // Sci-Fi & Fantasy
      getSeriesAcrossPages((page) => getSeriesByGenre(16, page)),  // Animation
    ]);

  const seen = new Set<number>();
  const trending = dedupeAgainst(trendingPool, seen);
  const popular = dedupeAgainst(popularPool, seen);
  const topRated = dedupeAgainst(topRatedPool, seen);
  const onAir = dedupeAgainst(onAirPool, seen);
  // Hindi rows get their own seen set so they aren't wiped out by global deduplication
  const hindiSeen = new Set<number>();
  const hindi = dedupeAgainst(hindiPool, hindiSeen);
  const drama = dedupeAgainst(dramaPool, seen);
  const crime = dedupeAgainst(crimePool, seen);
  const scifi = dedupeAgainst(scifiPool, seen);
  const animation = dedupeAgainst(animationPool, seen);

  return (
    <div className="bg-zinc-950 min-h-full text-white pt-24 pb-24">
      <div className="px-6 sm:px-10 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">Web Series</h1>
        <p className="text-white/50 mt-2 text-sm">Stream full seasons online — select any episode to watch</p>
      </div>
      <SeriesRow title="Trending This Week" series={trending} />
      <SeriesRow title="Hindi Web Series" series={hindi} />
      <SeriesRow title="Currently Airing" series={onAir} />
      <SeriesRow title="Popular Series" series={popular} />
      <SeriesRow title="Top Rated" series={topRated} />
      <SeriesRow title="Drama" series={drama} />
      <SeriesRow title="Crime" series={crime} />
      <SeriesRow title="Sci-Fi & Fantasy" series={scifi} />
      <SeriesRow title="Animation" series={animation} />
    </div>
  );
}
