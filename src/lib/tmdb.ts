const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
}

interface TmdbListResponse {
  results: TmdbMovie[];
}

function tmdbHeaders(): HeadersInit {
  const token = process.env.TMDB_API_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function tmdbApiKeyParam(): string {
  const apiKey = process.env.TMDB_API_KEY;
  return apiKey ? `api_key=${apiKey}&` : "";
}

async function tmdbFetch<T>(path: string, params = ""): Promise<T> {
  const url = `${TMDB_API_BASE}${path}?${tmdbApiKeyParam()}${params}`;
  const res = await fetch(url, {
    headers: tmdbHeaders(),
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`TMDB request failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

export function tmdbImageUrl(path: string | null, size: "w200" | "w500" | "original" = "w500"): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export async function getPopularMovies(page = 1): Promise<TmdbMovie[]> {
  const data = await tmdbFetch<TmdbListResponse>("/movie/popular", `page=${page}`);
  return data.results;
}

export async function getTopRatedMovies(page = 1): Promise<TmdbMovie[]> {
  const data = await tmdbFetch<TmdbListResponse>("/movie/top_rated", `page=${page}`);
  return data.results;
}

export async function getNowPlayingMovies(page = 1): Promise<TmdbMovie[]> {
  const data = await tmdbFetch<TmdbListResponse>("/movie/now_playing", `page=${page}`);
  return data.results;
}

export async function getUpcomingMovies(page = 1): Promise<TmdbMovie[]> {
  const data = await tmdbFetch<TmdbListResponse>("/movie/upcoming", `page=${page}`);
  return data.results;
}

export async function getTrendingMovies(page = 1): Promise<TmdbMovie[]> {
  const data = await tmdbFetch<TmdbListResponse>("/trending/movie/week", `page=${page}`);
  return data.results;
}

export const GENRES = {
  action: { id: 28, label: "Action" },
  comedy: { id: 35, label: "Comedy" },
  horror: { id: 27, label: "Horror" },
  scifi: { id: 878, label: "Sci-Fi" },
  romance: { id: 10749, label: "Romance" },
  animation: { id: 16, label: "Animation" },
  drama: { id: 18, label: "Drama" },
  thriller: { id: 53, label: "Thriller" },
} as const;

export type GenreKey = keyof typeof GENRES;

export async function getMoviesByGenre(genre: GenreKey, page = 1): Promise<TmdbMovie[]> {
  const data = await tmdbFetch<TmdbListResponse>(
    "/discover/movie",
    `with_genres=${GENRES[genre].id}&page=${page}`
  );
  return data.results;
}

export async function getAllMovies(page = 1): Promise<TmdbMovie[]> {
  const data = await tmdbFetch<TmdbListResponse>(
    "/discover/movie",
    `sort_by=popularity.desc&page=${page}`
  );
  return data.results;
}

const SOUTH_INDIAN_LANGUAGES = ["te", "ta", "ml", "kn"] as const;

// TMDB only catalogs each film once under its original language and has no
// "dubbed" flag, so this surfaces South Indian cinema (Telugu, Tamil,
// Malayalam, Kannada) in its original language; many of these titles are
// also available dubbed in Hindi through the embed provider's own audio
// track selector.
export async function getSouthIndianMovies(page = 1): Promise<TmdbMovie[]> {
  const results = await Promise.all(
    SOUTH_INDIAN_LANGUAGES.map((lang) =>
      tmdbFetch<TmdbListResponse>(
        "/discover/movie",
        `with_original_language=${lang}&region=IN&sort_by=popularity.desc&page=${page}`
      ).then((data) => data.results)
    )
  );
  const merged = results.flat();
  const seen = new Set<number>();
  return merged
    .filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)))
    .sort((a, b) => b.vote_average - a.vote_average);
}

export async function searchMovies(query: string): Promise<TmdbMovie[]> {
  const data = await tmdbFetch<TmdbListResponse>(
    "/search/movie",
    `query=${encodeURIComponent(query)}`
  );
  return data.results;
}

export async function getMovieDetails(id: string): Promise<TmdbMovie> {
  return tmdbFetch<TmdbMovie>(`/movie/${id}`);
}
