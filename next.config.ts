import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 90 : rendus détourés sur fond sombre, la compression par défaut (75) marque les dégradés.
    qualities: [75, 90],
  },
};

export default nextConfig;
