import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Product photos are served by MinIO locally and by an S3-compatible bucket in production.
    remotePatterns: [{ protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/**' }],
  },
}

export default nextConfig
