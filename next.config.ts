import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    // The build type-checks the whole project selected by this config, so it must not pick up the
    // route validator `next dev` leaves in `.next/dev/types`: a dev server that ran before a route
    // existed makes `next build` fail on generated files. See tsconfig.build.json.
    tsconfigPath: 'tsconfig.build.json',
  },
  experimental: {
    serverActions: {
      // A photo is posted to a Server Action, and the default cap is 1MB. The browser reduces the
      // picture to about 1200px before sending it, which lands well under this; the headroom is
      // for the multipart overhead and for a device where the reduction could not run.
      bodySizeLimit: '3mb',
    },
  },
  images: {
    // Product photos are served by MinIO locally and by an S3-compatible bucket in production.
    remotePatterns: [{ protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/**' }],
  },
}

export default nextConfig
