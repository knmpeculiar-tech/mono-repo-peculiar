import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public URLs for product/blog images — wildcarded
      // by hostname pattern rather than the specific project ref, so this
      // doesn't need updating if the Supabase project ever changes.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Client-selected, properly licensed stock photography — direct CDN
      // hotlinks to a specific chosen photo, not a random/keyword redirect.
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
};

export default nextConfig;
