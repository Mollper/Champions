import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // University photos come from Wikimedia Commons (see universities.image_url)
    remotePatterns: [
      { protocol: "https", hostname: "thumb.wikimedia.org", pathname: "/wikipedia/commons/**" },
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/wikipedia/commons/**" },
    ],
  },
  experimental: {
    // Every page here reads the signed-in user's own data, so it's never eligible for the
    // static prefetch cache; without this, clicking back into a page you just left re-runs
    // every query from zero. 30s of client-side reuse removes that wait for the common case
    // (nav back and forth) without showing data stale enough to matter.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
// UniRoute · next.config.ts
