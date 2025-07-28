import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // @ts-ignore
    appDir: true,
  },
};

export default nextConfig;
