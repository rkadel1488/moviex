import type { MetadataRoute } from "next";
import { GENRES, getPopularMovies, getTopRatedMovies } from "@/lib/tmdb";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: "daily", priority: 0.5 },
    { url: `${SITE_URL}/browse/all`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/browse/south-indian`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "monthly", priority: 0.2 },
  ];

  const genreRoutes: MetadataRoute.Sitemap = Object.keys(GENRES).map((key) => ({
    url: `${SITE_URL}/browse/${key}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  let movieRoutes: MetadataRoute.Sitemap = [];
  try {
    const [popular, topRated] = await Promise.all([getPopularMovies(), getTopRatedMovies()]);
    const ids = new Set<number>();
    [...popular, ...topRated].forEach((m) => ids.add(m.id));
    movieRoutes = Array.from(ids).map((id) => ({
      url: `${SITE_URL}/movie/${id}`,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    movieRoutes = [];
  }

  return [...staticRoutes, ...genreRoutes, ...movieRoutes];
}
