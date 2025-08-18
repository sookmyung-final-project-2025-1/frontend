import { NextConfig } from 'next';

const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET || 'http://localhost:8081';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_PROXY_TARGET}/:path*`,
      },
    ];
  },
};

export default nextConfig;
