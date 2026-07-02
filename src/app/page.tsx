import {
  getMoviesAcrossPages,
  getMoviesByGenre,
  getNowPlayingMovies,
  getPopularMovies,
  getRecentlyAddedMovies,
  getSouthIndianMovies,
  getTopRatedMovies,
  getTrendingMovies,
  getUpcomingMovies,
  getSeriesAcrossPages,
  getTrendingSeries,
  getPopularSeries,
  getTopRatedSeries,
  TmdbMovie,
  TmdbSeries,
} from "@/lib/tmdb";
import Link from "next/link";
import Hero from "@/components/Hero";
import MovieRow from "@/components/MovieRow";
import SeriesRow from "@/components/SeriesRow";
import HistoryRows from "@/components/HistoryRows";
import WatchlistRow from "@/components/WatchlistRow";

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

export default async function Home() {
  let movies: [TmdbMovie[], TmdbMovie[], TmdbMovie[], TmdbMovie[], TmdbMovie[], TmdbMovie[], TmdbMovie[], TmdbMovie[], TmdbMovie[], TmdbMovie[], TmdbMovie[], TmdbMovie[]] | null = null;
  let seriesData: [TmdbSeries[], TmdbSeries[], TmdbSeries[]] | null = null;
  let error: string | null = null;

  try {
    [movies, seriesData] = await Promise.all([
      Promise.all([
        getMoviesAcrossPages(getTrendingMovies),
        getMoviesAcrossPages(getPopularMovies),
        getMoviesAcrossPages(getRecentlyAddedMovies),
        getSouthIndianMovies(),
        getMoviesAcrossPages(getTopRatedMovies),
        getMoviesAcrossPages(getNowPlayingMovies),
        getMoviesAcrossPages(getUpcomingMovies),
        getMoviesAcrossPages((page) => getMoviesByGenre("action", page)),
        getMoviesAcrossPages((page) => getMoviesByGenre("comedy", page)),
        getMoviesAcrossPages((page) => getMoviesByGenre("horror", page)),
        getMoviesAcrossPages((page) => getMoviesByGenre("scifi", page)),
        getMoviesAcrossPages((page) => getMoviesByGenre("animation", page)),
      ]),
      Promise.all([
        getSeriesAcrossPages(getTrendingSeries),
        getSeriesAcrossPages(getPopularSeries),
        getSeriesAcrossPages(getTopRatedSeries),
      ]),
    ]);
  } catch {
    error = "Unable to load movies. Set TMDB_API_KEY or TMDB_API_TOKEN in your environment.";
  }

  if (error || !movies || !seriesData) {
    return (
      <div className="px-6 py-8 bg-zinc-950 min-h-full text-white/70">
        <p>{error}</p>
      </div>
    );
  }

  const [
    trendingPool,
    popularPool,
    recentlyAddedPool,
    southIndian,
    topRatedPool,
    nowPlayingPool,
    upcomingPool,
    actionPool,
    comedyPool,
    horrorPool,
    scifiPool,
    animationPool,
  ] = movies;

  const [trendingSeriesPool, popularSeriesPool, topRatedSeriesPool] = seriesData;

  const featuredCandidates = trendingPool.slice(0, 6);

  // Each row pulls from the same handful of popular movies, so dedupe
  // sequentially against everything shown above it to keep rows distinct.
  const seen = new Set<number>(southIndian.map((m) => m.id));
  const trending = dedupeAgainst(trendingPool, seen);
  const popular = dedupeAgainst(popularPool, seen);
  const recentlyAdded = dedupeAgainst(recentlyAddedPool, seen);
  const topRated = dedupeAgainst(topRatedPool, seen);
  const nowPlaying = dedupeAgainst(nowPlayingPool, seen);
  const upcoming = dedupeAgainst(upcomingPool, seen);
  const action = dedupeAgainst(actionPool, seen);
  const comedy = dedupeAgainst(comedyPool, seen);
  const horror = dedupeAgainst(horrorPool, seen);
  const scifi = dedupeAgainst(scifiPool, seen);
  const animation = dedupeAgainst(animationPool, seen);

  const seriesSeen = new Set<number>();
  const trendingSeries = dedupeAgainst(trendingSeriesPool, seriesSeen);
  const popularSeries = dedupeAgainst(popularSeriesPool, seriesSeen);
  const topRatedSeries = dedupeAgainst(topRatedSeriesPool, seriesSeen);

  return (
    <div className="bg-zinc-950 min-h-full">
      <Hero movies={featuredCandidates} />
      <div className="relative -mt-16 z-10 pt-4">
        <HistoryRows />
        <WatchlistRow />
        <MovieRow title="Trending Now" movies={trending} />
        <MovieRow title="Recently Added" movies={recentlyAdded} />
        <MovieRow title="Popular on MovieX" movies={popular} />
        <MovieRow title="South Indian Cinema" movies={southIndian} />
        <MovieRow title="Top Rated" movies={topRated} />
        <MovieRow title="Now Playing" movies={nowPlaying} />
        <MovieRow title="Upcoming" movies={upcoming} />
        <MovieRow title="Action" movies={action} />
        <MovieRow title="Comedy" movies={comedy} />
        <MovieRow title="Horror" movies={horror} />
        <MovieRow title="Sci-Fi" movies={scifi} />
        <MovieRow title="Animation" movies={animation} />
        <div className="mt-4 mb-2 px-6 sm:px-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Web Series</h2>
            <Link href="/series" className="text-sm text-red-400 hover:text-red-300 transition-colors">See all →</Link>
          </div>
        </div>
        <SeriesRow title="Trending Series" series={trendingSeries} />
        <SeriesRow title="Popular Series" series={popularSeries} />
        <SeriesRow title="Top Rated Series" series={topRatedSeries} />
      </div>
    </div>
  );
}
