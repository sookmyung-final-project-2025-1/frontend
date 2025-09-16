const API_BASE = process.env.API_BASE?.replace(/\/+$/, '');

const nextConfig = {
  async rewrites() {
    if (!API_BASE) return [];
    return [{ source: '/proxy/:path*', destination: `${API_BASE}/:path*` }];
  },
};
export default nextConfig;
