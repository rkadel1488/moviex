import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
    ],
    // TMDB already serves pre-resized images (w200/w500/original), so
    // running them through Vercel's Image Optimization just pays for a
    // second resize of an already-correctly-sized image.
    unoptimized: true,
  },
};

export default nextConfig;
