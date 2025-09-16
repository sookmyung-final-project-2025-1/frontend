// next.config.(js|mjs|ts)
const API = process.env.API_PROXY_TARGET;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // 방어 코드: ENV 없으면 rewrite 끔
    if (!API || !/^https?:\/\//.test(API)) {
      console.warn('[next.config] API_PROXY_TARGET invalid; skip rewrites');
      return [];
    }
    const base = API.replace(/\/+$/, ''); // 트레일링 슬래시 제거
    return [
      // 프록시 엔드포인트는 /proxy로 통일 (중복 /api 방지)
      { source: '/proxy/:path*', destination: `${base}/:path*` },
    ];
  },
};

export default nextConfig;
