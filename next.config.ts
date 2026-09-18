import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // All placeholder photography is served from Unsplash's CDN.
    // Swap this out (along with lib/images.ts) when real product shots land.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    // Required from Next 16 onwards — any `quality` outside this list is
    // coerced to the nearest allowed value.
    qualities: [60, 75, 90],
  },
};

export default nextConfig;
