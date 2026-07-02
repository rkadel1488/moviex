import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { searchMovies, searchSeries, tmdbImageUrl } from "@/lib/tmdb";
import SearchPageInput from "@/components/SearchPageInput";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for movies and series on MovieX.",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [movies, series] = query
    ? await Promise.all([searchMovies(query), searchSeries(query)])
    : [[], []];

  const hasResults = movies.length > 0 || series.length > 0;

  return (
    <div className="px-6 sm:px-10 pt-28 pb-16 bg-zinc-950 min-h-full">
      <h1 className="text-2xl font-bold text-white mb-6">
        {query ? `Results for "${query}"` : "Search"}
      </h1>
      <SearchPageInput initialQuery={query} />

      {query && !hasResults && (
        <p className="text-white/50">No results found.</p>
      )}

      {movies.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-white mb-4 mt-2">Movies</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8 mb-10">
            {movies.map((movie) => {
              const poster = tmdbImageUrl(movie.poster_path, "w500");
              return (
                <Link key={movie.id} href={`/movie/${movie.id}`} className="group flex flex-col gap-2">
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
                      <div className="w-full h-full flex items-center justify-center text-white/30 text-xs text-center px-2">No image</div>
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
        </>
      )}

      {series.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-white mb-4">Series</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
            {series.map((show) => {
              const poster = tmdbImageUrl(show.poster_path, "w500");
              return (
                <Link key={show.id} href={`/series/${show.id}`} className="group flex flex-col gap-2">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 ring-1 ring-white/5 shadow-lg shadow-black/40 transition-transform duration-200 group-hover:-translate-y-1 group-hover:ring-red-500/50">
                    {poster ? (
                      <Image
                        src={poster}
                        alt={show.name}
                        fill
                        sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30 text-xs text-center px-2">No image</div>
                    )}
                    <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-semibold text-yellow-400">
                      ★ {show.vote_average.toFixed(1)}
                    </div>
                    <div className="absolute top-1 left-1 bg-red-600/90 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wide">
                      Series
                    </div>
                  </div>
                  <p className="text-sm text-white/90 font-medium line-clamp-2 group-hover:text-red-400 transition-colors">
                    {show.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
