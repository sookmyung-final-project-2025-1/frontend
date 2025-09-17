// next.config.ts
import type { NextConfig } from 'next';

const API_BASE = process.env.API_BASE_URL?.replace(/\/+$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async rewrites() {
    if (!API_BASE || !/^https?:\/\//.test(API_BASE)) {
      console.warn('[next.config] API_BASE invalid; skip rewrites');
      return [];
    }
    return [{ source: '/proxy/:path*', destination: `${API_BASE}/:path*` }];
  },
};

export default nextConfig;
