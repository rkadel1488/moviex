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
  TmdbMovie,
} from "@/lib/tmdb";
import Hero from "@/components/Hero";
import MovieRow from "@/components/MovieRow";
import HistoryRows from "@/components/HistoryRows";
import WatchlistRow from "@/components/WatchlistRow";

function dedupeAgainst(movies: TmdbMovie[], seen: Set<number>, limit = 20): TmdbMovie[] {
  const result: TmdbMovie[] = [];
  for (const movie of movies) {
    if (seen.has(movie.id)) continue;
    seen.add(movie.id);
    result.push(movie);
    if (result.length >= limit) break;
  }
  return result;
}

export default async function Home() {
  let result: [
    TmdbMovie[],
    TmdbMovie[],
    TmdbMovie[],
    TmdbMovie[],
    TmdbMovie[],
    TmdbMovie[],
    TmdbMovie[],
    TmdbMovie[],
    TmdbMovie[],
    TmdbMovie[],
    TmdbMovie[],
    TmdbMovie[],
  ] | null = null;
  let error: string | null = null;

  try {
    result = await Promise.all([
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
    ]);
  } catch {
    error = "Unable to load movies. Set TMDB_API_KEY or TMDB_API_TOKEN in your environment.";
  }

  if (error || !result) {
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
  ] = result;

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
      </div>
    </div>
  );
}
