import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const directoryName = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: directoryName,
  },
  images: {
    formats: ["image/webp"],
    // CMS uploads keep unique filenames, so optimized variants can cache hard.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Allow optimizer to fetch backend media from Docker / private LAN IPs.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "musafir.com" },
      { protocol: "https", hostname: "www.musafir.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/about", destination: "/about-us", permanent: true },
      { source: "/:locale/about", destination: "/:locale/about-us", permanent: true },
      { source: "/:locale/collections/complete-sets", destination: "/:locale/collections/matching-pairs", permanent: true },
      { source: "/:locale/tack", destination: "/:locale/collections/all", permanent: true },
      { source: "/:locale/tack/:path*", destination: "/:locale/collections/all", permanent: true },
      { source: "/:locale/saddles", destination: "/:locale/collections/all", permanent: true },
      { source: "/:locale/saddles/:path*", destination: "/:locale/collections/all", permanent: true },
      { source: "/:locale/custom/colors", destination: "/:locale/collections/all", permanent: true },
      { source: "/:locale/custom/personalization", destination: "/:locale/collections/all", permanent: true },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "80mb",
    },
    proxyClientMaxBodySize: "80mb",
  },
};

export default nextConfig;
