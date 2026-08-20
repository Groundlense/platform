import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  // Proxy API calls to the NestJS backend during development. Derived from
  // API_URL so it works both in Docker (http://api:8000) and on the host.
  async rewrites() {
    const apiOrigin = (process.env.API_URL || "http://127.0.0.1:8000/api/v1")
      .replace(/\/+$/, "")
      .replace(/\/api\/v1$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

