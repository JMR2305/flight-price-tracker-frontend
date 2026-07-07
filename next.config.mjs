/** @type {import('next').NextConfig} */
  const nextConfig = {
    output: "standalone",
    // Force a unique build ID each deploy so Vercel never serves stale cached bundles
    generateBuildId: async () => `build-${Date.now()}`,
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            { key: "Cache-Control", value: "no-store" },
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
  