import { NextConfig } from 'next';

const API_BASE = process.env.API_BASE_URL?.replace(/\/+$/, ''); // 끝 슬래시 제거

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!API_BASE || !/^https?:\/\//.test(API_BASE)) return [];
    // ✅ WS 경로는 제외, REST만 rewrite
    return [{ source: '/proxy/api/:path*', destination: `${API_BASE}/:path*` }];
  },
};
export default nextConfig;
