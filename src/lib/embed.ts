const DEFAULT_EMBED_BASE_URL = "https://vidsrc.to/embed/movie";

export function getMovieEmbedUrl(tmdbId: string): string {
  const base = process.env.NEXT_PUBLIC_EMBED_BASE_URL ?? DEFAULT_EMBED_BASE_URL;
  return `${base}/${tmdbId}`;
}
