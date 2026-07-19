import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    return [
      { source: '/mandala', destination: '/mandala/index.html' },
      { source: '/mandala/', destination: '/mandala/index.html' },
    ]
  },
}

export default nextConfig
