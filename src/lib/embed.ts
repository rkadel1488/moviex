const DEFAULT_EMBED_BASE_URL = "https://multiembed.mov/?video_id=";

export function getMovieEmbedUrl(tmdbId: string): string {
  const base = process.env.NEXT_PUBLIC_EMBED_BASE_URL ?? DEFAULT_EMBED_BASE_URL;
  return `${base}${tmdbId}&tmdb=1`;
}
