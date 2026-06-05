import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/notifications/:path*',
        destination: '/api/notifications/:path*',
      },
      {
        source: '/recruitment/jobs/:path*',
        destination: '/api/jobs/:path*',
      },
    ];
  },
};

export default nextConfig;
