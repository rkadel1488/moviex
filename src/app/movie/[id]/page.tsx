import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getMovieDetails, getRecommendedMovies, getSimilarMovies, tmdbImageUrl } from "@/lib/tmdb";
import { getMovieEmbedUrl } from "@/lib/embed";
import { SITE_URL } from "@/lib/site";
import RecordVisit from "@/components/RecordVisit";
import MovieRow from "@/components/MovieRow";
import WatchlistButton from "@/components/WatchlistButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const movie = await getMovieDetails(id);
  const year = movie.release_date ? movie.release_date.slice(0, 4) : null;
  const title = year ? `Watch ${movie.title} (${year})` : `Watch ${movie.title}`;
  const description = movie.overview || `Watch ${movie.title} online on MovieX.`;
  const poster = tmdbImageUrl(movie.poster_path, "w500");

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/movie/${id}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/movie/${id}`,
      type: "video.movie",
      images: poster ? [{ url: poster }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: poster ? [poster] : undefined,
    },
  };
}

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await getMovieDetails(id);
  const backdrop = tmdbImageUrl(movie.backdrop_path, "original");
  const poster = tmdbImageUrl(movie.poster_path, "w500");
  const embedUrl = getMovieEmbedUrl(id);
  const year = movie.release_date ? movie.release_date.slice(0, 4) : null;

  const [recommended, similar] = await Promise.all([
    getRecommendedMovies(id).catch(() => []),
    getSimilarMovies(id).catch(() => []),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    description: movie.overview,
    image: poster ?? undefined,
    datePublished: movie.release_date || undefined,
    aggregateRating: movie.vote_average
      ? {
          "@type": "AggregateRating",
          ratingValue: movie.vote_average,
          bestRating: 10,
          worstRating: 0,
        }
      : undefined,
    url: `${SITE_URL}/movie/${id}`,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: movie.title, item: `${SITE_URL}/movie/${id}` },
    ],
  };

  return (
    <div className="bg-zinc-950 min-h-full text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <RecordVisit
        id={movie.id}
        title={movie.title}
        poster_path={movie.poster_path}
        vote_average={movie.vote_average}
      />
      <div className="relative h-[40vh] sm:h-[50vh]">
        {backdrop && (
          <Image
            src={backdrop}
            alt={movie.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/10" />
      </div>

      <div className="px-6 sm:px-10 max-w-5xl mx-auto -mt-24 relative pb-16">
        <nav aria-label="Breadcrumb" className="text-xs text-white/50 mb-4">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-white/80">{movie.title}</span>
        </nav>
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          {poster && (
            <Image
              src={poster}
              alt={movie.title}
              width={176}
              height={264}
              className="w-32 sm:w-44 h-auto rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10 shrink-0"
            />
          )}
          <div className="flex flex-col justify-end">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">{movie.title}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-white/60">
              {year && <span>{year}</span>}
              <span className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1 text-yellow-400 font-semibold">
                ★ {movie.vote_average.toFixed(1)}
              </span>
            </div>
            <p className="text-white/80 mt-4 max-w-2xl leading-relaxed">{movie.overview}</p>
            <div className="mt-4">
              <WatchlistButton
                id={movie.id}
                title={movie.title}
                poster_path={movie.poster_path}
                vote_average={movie.vote_average}
              />
            </div>
          </div>
        </div>

        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black ring-1 ring-white/10 shadow-2xl shadow-black/50">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            referrerPolicy="no-referrer"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          />
        </div>
      </div>

      <div className="mt-12 pb-16">
        <MovieRow title="Recommended Movies" movies={recommended} />
        <MovieRow title="Related Movies" movies={similar} />
      </div>
    </div>
  );
}
