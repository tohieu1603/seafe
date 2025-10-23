import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Use environment variable for API backend
    // Note: apiUrl should include /api in the URL, e.g., http://localhost:8003
    const apiUrl = process.env.API_BACKEND_URL || 'http://localhost:8003'

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
