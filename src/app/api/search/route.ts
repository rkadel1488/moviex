import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) return NextResponse.json({ results: [] });

  const movies = await searchMovies(query);
  return NextResponse.json({
    results: movies.slice(0, 10).map((m) => ({
      id: m.id,
      title: m.title,
      poster_path: m.poster_path,
      year: m.release_date ? m.release_date.slice(0, 4) : null,
    })),
  });
}
