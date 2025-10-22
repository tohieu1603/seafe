import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Use environment variable for API backend
    const apiUrl = process.env.API_BACKEND_URL || 'http://backend:8000'

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
