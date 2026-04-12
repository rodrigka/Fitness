import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/Fitness",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
