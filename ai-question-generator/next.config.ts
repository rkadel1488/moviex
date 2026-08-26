import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "mammoth", "@react-pdf/renderer"],
  // This app is a self-contained project living inside the moviex repo
  // (which has its own lockfile); pin the root explicitly so Turbopack
  // doesn't try to infer it from the parent directory.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
