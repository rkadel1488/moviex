import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  getSeriesDetails,
  getSeasonDetails,
  getRecommendedSeries,
  getSimilarSeries,
  tmdbImageUrl,
} from "@/lib/tmdb";
import { SITE_URL } from "@/lib/site";
import EpisodePicker from "@/components/EpisodePicker";
import SeriesRow from "@/components/SeriesRow";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const series = await getSeriesDetails(id);
  const year = series.first_air_date ? series.first_air_date.slice(0, 4) : null;
  const title = year ? `Watch ${series.name} (${year})` : `Watch ${series.name}`;
  const description = series.overview || `Watch ${series.name} online on MovieX.`;
  const poster = tmdbImageUrl(series.poster_path, "w500");

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/series/${id}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/series/${id}`,
      type: "video.tv_show",
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

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const series = await getSeriesDetails(id);
  const backdrop = tmdbImageUrl(series.backdrop_path, "original");
  const poster = tmdbImageUrl(series.poster_path, "w500");
  const year = series.first_air_date ? series.first_air_date.slice(0, 4) : null;

  const playableSeasons = (series.seasons ?? []).filter((s) => s.season_number > 0);
  const firstSeason = playableSeasons[0]?.season_number ?? 1;

  const [season1, recommended, similar] = await Promise.all([
    getSeasonDetails(id, firstSeason).catch(() => ({ season_number: firstSeason, name: "Season 1", episodes: [] })),
    getRecommendedSeries(id).catch(() => []),
    getSimilarSeries(id).catch(() => []),
  ]);

  return (
    <div className="bg-zinc-950 min-h-full text-white">
      <div className="relative h-[40vh] sm:h-[50vh]">
        {backdrop && (
          <Image
            src={backdrop}
            alt={series.name}
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
          <Link href="/series" className="hover:text-white transition-colors">Series</Link>
          <span className="mx-1.5">/</span>
          <span className="text-white/80">{series.name}</span>
        </nav>

        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          {poster && (
            <Image
              src={poster}
              alt={series.name}
              width={176}
              height={264}
              className="w-32 sm:w-44 h-auto rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10 shrink-0"
            />
          )}
          <div className="flex flex-col justify-end">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">{series.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-white/60">
              {year && <span>{year}</span>}
              {series.number_of_seasons && (
                <span>{series.number_of_seasons} Season{series.number_of_seasons !== 1 ? "s" : ""}</span>
              )}
              <span className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1 text-yellow-400 font-semibold">
                ★ {series.vote_average.toFixed(1)}
              </span>
            </div>
            <p className="text-white/80 mt-4 max-w-2xl leading-relaxed">{series.overview}</p>
          </div>
        </div>

        <EpisodePicker
          seriesId={id}
          seasons={playableSeasons}
          initialSeason={firstSeason}
          initialEpisodes={season1.episodes}
        />
      </div>

      <div className="mt-12 pb-16">
        <SeriesRow title="Recommended Series" series={recommended} />
        <SeriesRow title="Related Series" series={similar} />
      </div>
    </div>
  );
}
