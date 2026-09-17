import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // University photos come from Wikimedia Commons (see universities.image_url)
    remotePatterns: [
      { protocol: "https", hostname: "thumb.wikimedia.org", pathname: "/wikipedia/commons/**" },
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/wikipedia/commons/**" },
    ],
  },
};

export default nextConfig;
