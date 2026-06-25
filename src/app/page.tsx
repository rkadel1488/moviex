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
    <div className="px-6 py-8 bg-zinc-950 min-h-full">
      <h1 className="text-2xl font-bold text-white mb-6">Popular Movies</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {movies.map((movie) => {
          const poster = tmdbImageUrl(movie.poster_path, "w500");
          return (
            <Link
              key={movie.id}
              href={`/movie/${movie.id}`}
              className="group flex flex-col gap-2"
            >
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800">
                {poster && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={poster}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                )}
              </div>
              <p className="text-sm text-white/90 line-clamp-2">{movie.title}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
