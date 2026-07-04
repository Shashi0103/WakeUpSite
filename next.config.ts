import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['jose', 'jwks-rsa'],
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && apiUrl.startsWith('http')) {
      return [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
