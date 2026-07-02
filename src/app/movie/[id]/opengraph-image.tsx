import { ImageResponse } from "next/og";
import { getMovieDetails, tmdbImageUrl } from "@/lib/tmdb";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = await getMovieDetails(id).catch(() => null);

  const title = movie?.title ?? "MovieX";
  const year = movie?.release_date ? movie.release_date.slice(0, 4) : null;
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : null;
  const overview = movie?.overview ? movie.overview.slice(0, 120) + (movie.overview.length > 120 ? "…" : "") : "";
  const posterUrl = movie?.poster_path ? tmdbImageUrl(movie.poster_path, "w500") : null;

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
        {/* Poster */}
        {posterUrl && (
          <img
            src={posterUrl}
            alt={title}
            style={{ width: 420, height: 630, objectFit: "cover", flexShrink: 0 }}
          />
        )}

        {/* Right panel */}
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
          {/* MovieX brand */}
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 32 }}>
            MOVIE<span style={{ color: "#e50914" }}>X</span>
          </div>

          {/* Title */}
          <div style={{ fontSize: 52, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 12 }}>
            {title}
          </div>

          {/* Year + Rating */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            {year && (
              <span style={{ fontSize: 24, color: "rgba(255,255,255,0.5)" }}>{year}</span>
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

          {/* Overview */}
          {overview && (
            <div style={{ fontSize: 22, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
              {overview}
            </div>
          )}

          {/* Watch now CTA */}
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
