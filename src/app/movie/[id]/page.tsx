import { getMovieDetails, tmdbImageUrl } from "@/lib/tmdb";
import { getMovieEmbedUrl } from "@/lib/embed";

export const dynamic = "force-dynamic";

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await getMovieDetails(id);
  const backdrop = tmdbImageUrl(movie.backdrop_path, "original");
  const embedUrl = getMovieEmbedUrl(id);

  return (
    <div className="bg-zinc-950 min-h-full text-white">
      {backdrop && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backdrop}
          alt={movie.title}
          className="w-full h-64 object-cover opacity-40"
        />
      )}
      <div className="px-6 py-8 max-w-4xl mx-auto -mt-16 relative">
        <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
        <p className="text-sm text-white/60 mb-4">
          {movie.release_date} · ⭐ {movie.vote_average.toFixed(1)}
        </p>
        <p className="text-white/80 mb-8">{movie.overview}</p>

        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-presentation"
          />
        </div>
      </div>
    </div>
  );
}
