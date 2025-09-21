// next.config.ts
import type { NextConfig } from 'next';

// API_BASE_URL는 반드시 /api까지 포함하게 두세요. (예: https://211.110.155.54/api)
const API_BASE = process.env.API_BASE_URL?.replace(/\/+$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!API_BASE || !/^https?:\/\//.test(API_BASE)) {
      console.warn('[next.config] API_BASE invalid; skip rewrites');
      return [];
    }
    return [
      // ✅ REST만 프록시: /proxy/api/** → https://211.110.155.54/api/**
      { source: '/proxy/api/:path*', destination: `${API_BASE}/:path*` },

      // ❌ WS는 리라이트 금지! (규칙 추가하지 마세요)
      // { source: '/proxy/ws/:path*', destination: '...' }  <-- 만들지 않기
    ];
  },
};

export default nextConfig;
