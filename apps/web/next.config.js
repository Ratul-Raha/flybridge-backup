/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@flybridge/ui", "@flybridge/config"],
  experimental: {
    // The GA4 Data API client is a Node-only gRPC library — keep it out of the
    // server bundle instead of pulling google-gax (and its package.json lookup)
    // through webpack.
    serverComponentsExternalPackages: ["@google-analytics/data"],
  },
  compiler: {
    removeConsole: { exclude: ["error"] },
  },
  images: {
    // The Image Optimizer's default minimumCacheTTL is 60s, which re-fetched and
    // re-encoded the same remote originals far too often. These remotePatterns
    // (Cloudinary/S3) point at effectively immutable assets, so cache optimized
    // variants at the edge for a week.
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
