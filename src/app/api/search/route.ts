import { NextRequest, NextResponse } from "next/server";
import { searchMovies, searchSeries } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) return NextResponse.json({ results: [] });

  const [movies, series] = await Promise.all([
    searchMovies(query),
    searchSeries(query),
  ]);

  const movieResults = movies.slice(0, 8).map((m) => ({
    id: m.id,
    title: m.title,
    poster_path: m.poster_path,
    year: m.release_date ? m.release_date.slice(0, 4) : null,
    type: "movie" as const,
  }));

  const seriesResults = series.slice(0, 5).map((s) => ({
    id: s.id,
    title: s.name,
    poster_path: s.poster_path,
    year: s.first_air_date ? s.first_air_date.slice(0, 4) : null,
    type: "series" as const,
  }));

  // Interleave: show top movies first, then series, total 10
  const combined = [...movieResults, ...seriesResults].slice(0, 10);

  return NextResponse.json({ results: combined });
}
