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

const GENRE_IDS = {
  action: 28,
  comedy: 35,
  horror: 27,
  scifi: 878,
  romance: 10749,
  animation: 16,
} as const;

export async function getMoviesByGenre(
  genre: keyof typeof GENRE_IDS,
  page = 1
): Promise<TmdbMovie[]> {
  const data = await tmdbFetch<TmdbListResponse>(
    "/discover/movie",
    `with_genres=${GENRE_IDS[genre]}&page=${page}`
  );
  return data.results;
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
