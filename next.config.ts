import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'img.clerk.com', // Clerk profile images
      'images.clerk.dev', // Clerk CDN
      'clerk.com', // Additional Clerk domains
    ],
    // Alternative: Use remotePatterns for more control
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
