import Link from "next/link";
import { TmdbMovie, tmdbImageUrl } from "@/lib/tmdb";

export default function Hero({ movie }: { movie: TmdbMovie }) {
  const backdrop = tmdbImageUrl(movie.backdrop_path, "original");

  return (
    <div className="relative w-full h-[56vw] max-h-[80vh] min-h-[420px]">
      {backdrop && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backdrop}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent" />

      <div className="absolute bottom-0 left-0 px-6 sm:px-10 pb-16 max-w-2xl">
        <h1 className="text-3xl sm:text-5xl font-bold text-white drop-shadow-lg mb-4">
          {movie.title}
        </h1>
        <p className="hidden sm:block text-white/85 text-base leading-relaxed line-clamp-3 mb-6 drop-shadow">
          {movie.overview}
        </p>
        <div className="flex items-center gap-3">
          <Link
            href={`/movie/${movie.id}`}
            className="flex items-center gap-2 bg-white text-black font-semibold px-6 py-2.5 rounded-md hover:bg-white/85 transition-colors"
          >
            ▶ Play
          </Link>
          <Link
            href={`/movie/${movie.id}`}
            className="flex items-center gap-2 bg-white/20 text-white font-semibold px-6 py-2.5 rounded-md hover:bg-white/30 transition-colors backdrop-blur-sm"
          >
            ℹ More Info
          </Link>
        </div>
      </div>
    </div>
  );
}
