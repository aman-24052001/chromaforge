import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/chromaforge",
  assetPrefix: "/chromaforge/",
  images: { unoptimized: true },
};

export default nextConfig;
