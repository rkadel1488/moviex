import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  GENRES,
  GenreKey,
  getAllMovies,
  getMoviesByGenre,
  getSouthIndianMovies,
  tmdbImageUrl,
} from "@/lib/tmdb";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

function genreHeading(genre: string): string {
  if (genre === "all") return "All Movies";
  if (genre === "south-indian") return "South Indian Cinema";
  return GENRES[genre as GenreKey]?.label ?? genre;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genre: string }>;
}): Promise<Metadata> {
  const { genre } = await params;
  const heading = genreHeading(genre);
  const title = `${heading} Movies`;
  const description = `Browse and stream ${heading.toLowerCase()} movies online for free on MovieX.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/browse/${genre}` },
    openGraph: { title, description, url: `${SITE_URL}/browse/${genre}` },
  };
}

export default async function BrowsePage({
  params,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { genre } = await params;
  if (genre !== "all" && genre !== "south-indian" && !(genre in GENRES)) notFound();

  const isAll = genre === "all";
  const isSouthIndian = genre === "south-indian";
  const genreKey = genre as GenreKey;
  const movies = isAll
    ? await getAllMovies()
    : isSouthIndian
      ? await getSouthIndianMovies()
      : await getMoviesByGenre(genreKey);
  const heading = genreHeading(genre);

  return (
    <div className="px-6 sm:px-10 pt-28 pb-16 bg-zinc-950 min-h-full">
      <h1 className="text-3xl font-bold text-white mb-6">{heading}</h1>
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
                  <img src={poster} alt={movie.title} className="w-full h-full object-cover" />
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
