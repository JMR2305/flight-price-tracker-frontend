/** @type {import('next').NextConfig} */
  const nextConfig = {
    output: "standalone",
    // Unique build ID per deploy — prevents Vercel from reusing stale compiled bundles
    generateBuildId: async () => `build-${Date.now()}`,
    async headers() {
      return [
        {
          // Prevent caching of HTML pages only (not _next/static assets)
          source: "/((?!_next|favicon\.ico).*)",
          headers: [
            { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
            { key: "Pragma", value: "no-cache" },
            { key: "Expires", value: "0" },
          ],
        },
      ];
    },
    async rewrites() {
      return [
        {
          source: "/api/:path*",
          destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/:path*`,
        },
      ];
    },
  };

  export default nextConfig;
  