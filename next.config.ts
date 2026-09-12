import type { NextConfig } from 'next'

/**
 * Where product photos are served from. Read here rather than hardcoded so that swapping MinIO for
 * R2, S3 or Supabase Storage stays a change of `S3_PUBLIC_URL` alone, as ADR 0001 intends — with
 * the compose default as the fallback, which is what a fresh clone runs.
 */
const storage = new URL(process.env.S3_PUBLIC_URL ?? 'http://localhost:9000/artesanal')

/** 127.0.0.1 by any name. In development and in CI the bucket is on this machine. */
const storageIsLocal = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(storage.hostname)

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
    remotePatterns: [
      {
        protocol: storage.protocol.replace(':', '') as 'http' | 'https',
        hostname: storage.hostname,
        port: storage.port,
        pathname: '/**',
      },
    ],
    /**
     * Next 16 refuses to optimise an image whose host resolves to a private IP, which is its SSRF
     * guard and the right default. MinIO in development and in CI is exactly such a host and only
     * such a host, so the guard is lifted only while the bucket is on this machine: against a real
     * bucket in production this stays false and the protection is untouched.
     */
    dangerouslyAllowLocalIP: storageIsLocal,
  },
}

export default nextConfig
