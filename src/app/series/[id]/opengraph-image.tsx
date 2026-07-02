import { ImageResponse } from "next/og";
import { getSeriesDetails, tmdbImageUrl } from "@/lib/tmdb";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const series = await getSeriesDetails(id).catch(() => null);

  const title = series?.name ?? "MovieX";
  const year = series?.first_air_date ? series.first_air_date.slice(0, 4) : null;
  const rating = series?.vote_average ? series.vote_average.toFixed(1) : null;
  const seasons = series?.number_of_seasons ?? null;
  const overview = series?.overview ? series.overview.slice(0, 120) + (series.overview.length > 120 ? "…" : "") : "";
  const posterUrl = series?.poster_path ? tmdbImageUrl(series.poster_path, "w500") : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#09090b",
          fontFamily: "sans-serif",
        }}
      >
        {posterUrl && (
          <img
            src={posterUrl}
            alt={title}
            style={{ width: 420, height: 630, objectFit: "cover", flexShrink: 0 }}
          />
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "48px 52px",
            background: "linear-gradient(to right, #09090b, #18181b)",
          }}
        >
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 32 }}>
            MOVIE<span style={{ color: "#e50914" }}>X</span>
          </div>

          <div style={{ fontSize: 52, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 12 }}>
            {title}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            {year && (
              <span style={{ fontSize: 24, color: "rgba(255,255,255,0.5)" }}>{year}</span>
            )}
            {seasons && (
              <span style={{ fontSize: 24, color: "rgba(255,255,255,0.5)" }}>
                {seasons} Season{seasons !== 1 ? "s" : ""}
              </span>
            )}
            {rating && (
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#facc15",
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 999,
                  padding: "4px 16px",
                }}
              >
                ★ {rating}
              </span>
            )}
          </div>

          {overview && (
            <div style={{ fontSize: 22, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
              {overview}
            </div>
          )}

          <div
            style={{
              marginTop: 36,
              fontSize: 22,
              fontWeight: 600,
              color: "#fff",
              background: "#e50914",
              borderRadius: 8,
              padding: "12px 28px",
              display: "inline-flex",
              alignSelf: "flex-start",
            }}
          >
            ▶ Watch Now on MovieX
          </div>
        </div>
      </div>
    ),
    size
  );
}
