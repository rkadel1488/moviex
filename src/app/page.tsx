import Link from "next/link";
import { getPopularMovies, tmdbImageUrl } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

export default async function Home() {
  let movies: Awaited<ReturnType<typeof getPopularMovies>> = [];
  let error: string | null = null;
  try {
    movies = await getPopularMovies();
  } catch {
    error = "Unable to load movies. Set TMDB_API_KEY or TMDB_API_TOKEN in your environment.";
  }

  if (error) {
    return (
      <div className="px-6 py-8 bg-zinc-950 min-h-full text-white/70">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-10 py-10 bg-zinc-950 min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Popular Movies</h1>
        <p className="text-white/50 mt-1">Trending right now on MovieX</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
        {movies.map((movie) => {
          const poster = tmdbImageUrl(movie.poster_path, "w500");
          return (
            <Link
              key={movie.id}
              href={`/movie/${movie.id}`}
              className="group flex flex-col gap-2"
            >
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 ring-1 ring-white/5 shadow-lg shadow-black/40 transition-transform duration-200 group-hover:-translate-y-1 group-hover:ring-red-500/50">
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={poster}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/30 text-xs text-center px-2">
                    No image
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-semibold text-yellow-400">
                  ★ {movie.vote_average.toFixed(1)}
                </div>
              </div>
              <p className="text-sm text-white/90 font-medium line-clamp-2 group-hover:text-red-400 transition-colors">
                {movie.title}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
