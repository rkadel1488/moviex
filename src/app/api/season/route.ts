import { NextRequest, NextResponse } from "next/server";
import { getSeasonDetails } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  const season = Number(searchParams.get("season"));

  if (!id || !season) {
    return NextResponse.json({ error: "Missing id or season" }, { status: 400 });
  }

  try {
    const data = await getSeasonDetails(id, season);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch season" }, { status: 500 });
  }
}
