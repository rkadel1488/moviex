import {
  getMoviesByGenre,
  getNowPlayingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies,
  getUpcomingMovies,
} from "@/lib/tmdb";
import Hero from "@/components/Hero";
import MovieRow from "@/components/MovieRow";
import HistoryRows from "@/components/HistoryRows";

export const dynamic = "force-dynamic";

export default async function Home() {
  let result: [
    Awaited<ReturnType<typeof getPopularMovies>>,
    Awaited<ReturnType<typeof getTopRatedMovies>>,
    Awaited<ReturnType<typeof getNowPlayingMovies>>,
    Awaited<ReturnType<typeof getUpcomingMovies>>,
    Awaited<ReturnType<typeof getTrendingMovies>>,
    Awaited<ReturnType<typeof getMoviesByGenre>>,
    Awaited<ReturnType<typeof getMoviesByGenre>>,
    Awaited<ReturnType<typeof getMoviesByGenre>>,
    Awaited<ReturnType<typeof getMoviesByGenre>>,
    Awaited<ReturnType<typeof getMoviesByGenre>>,
  ] | null = null;
  let error: string | null = null;

  try {
    result = await Promise.all([
      getPopularMovies(),
      getTopRatedMovies(),
      getNowPlayingMovies(),
      getUpcomingMovies(),
      getTrendingMovies(),
      getMoviesByGenre("action"),
      getMoviesByGenre("comedy"),
      getMoviesByGenre("horror"),
      getMoviesByGenre("scifi"),
      getMoviesByGenre("animation"),
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
    popular,
    topRated,
    nowPlaying,
    upcoming,
    trending,
    action,
    comedy,
    horror,
    scifi,
    animation,
  ] = result;

  const featuredCandidates = trending.slice(0, 6);

  return (
    <div className="bg-zinc-950 min-h-full">
      <Hero movies={featuredCandidates} />
      <div className="relative -mt-16 z-10 pt-4">
        <HistoryRows />
        <MovieRow title="Trending Now" movies={trending} />
        <MovieRow title="Popular on MovieX" movies={popular} />
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
