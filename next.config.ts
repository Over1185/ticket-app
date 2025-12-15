import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Optimizar el handling de caché
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  // Comprimir las respuestas
  compress: true,
};

export default nextConfig;
