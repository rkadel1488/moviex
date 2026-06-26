import {
  getNowPlayingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
} from "@/lib/tmdb";
import Hero from "@/components/Hero";
import MovieRow from "@/components/MovieRow";

export const dynamic = "force-dynamic";

export default async function Home() {
  let result: [
    Awaited<ReturnType<typeof getPopularMovies>>,
    Awaited<ReturnType<typeof getTopRatedMovies>>,
    Awaited<ReturnType<typeof getNowPlayingMovies>>,
    Awaited<ReturnType<typeof getUpcomingMovies>>,
  ] | null = null;
  let error: string | null = null;

  try {
    result = await Promise.all([
      getPopularMovies(),
      getTopRatedMovies(),
      getNowPlayingMovies(),
      getUpcomingMovies(),
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

  const [popular, topRated, nowPlaying, upcoming] = result;
  const featured = popular[0];

  return (
    <div className="bg-zinc-950 min-h-full">
      <Hero movie={featured} />
      <div className="relative -mt-16 z-10 pt-4">
        <MovieRow title="Popular on MovieX" movies={popular} />
        <MovieRow title="Top Rated" movies={topRated} />
        <MovieRow title="Now Playing" movies={nowPlaying} />
        <MovieRow title="Upcoming" movies={upcoming} />
      </div>
    </div>
  );
}
