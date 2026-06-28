import Link from "next/link";
import Image from "next/image";
import { getPopularMovies, tmdbImageUrl } from "@/lib/tmdb";

export default async function NotFound() {
  const movies = await getPopularMovies().catch(() => []);

  return (
    <div className="px-6 sm:px-10 pt-28 pb-16 bg-zinc-950 min-h-full text-white">
      <h1 className="text-4xl font-bold mb-2">Lost the plot?</h1>
      <p className="text-white/60 mb-10">
        That page doesn&apos;t exist, but here&apos;s something popular to watch instead.
      </p>
      <Link
        href="/"
        className="inline-block mb-10 bg-red-600 hover:bg-red-500 transition-colors font-semibold px-5 py-2.5 rounded-md"
      >
        Back to Home
      </Link>
      {movies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
          {movies.slice(0, 12).map((movie) => {
            const poster = tmdbImageUrl(movie.poster_path, "w500");
            return (
              <Link
                key={movie.id}
                href={`/movie/${movie.id}`}
                className="group flex flex-col gap-2"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 ring-1 ring-white/5 shadow-lg shadow-black/40 transition-transform duration-200 group-hover:-translate-y-1 group-hover:ring-red-500/50">
                  {poster ? (
                    <Image
                      src={poster}
                      alt={movie.title}
                      fill
                      sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30 text-xs text-center px-2">
                      No image
                    </div>
                  )}
                </div>
                <p className="text-sm text-white/90 font-medium line-clamp-2 group-hover:text-red-400 transition-colors">
                  {movie.title}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
