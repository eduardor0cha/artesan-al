import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    // The build type-checks the whole project selected by this config, so it must not pick up the
    // route validator `next dev` leaves in `.next/dev/types`: a dev server that ran before a route
    // existed makes `next build` fail on generated files. See tsconfig.build.json.
    tsconfigPath: 'tsconfig.build.json',
  },
  images: {
    // Product photos are served by MinIO locally and by an S3-compatible bucket in production.
    remotePatterns: [{ protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/**' }],
  },
}

export default nextConfig
