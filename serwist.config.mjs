import { serwist } from '@serwist/next/config'

/**
 * Serwist's Next plugin is webpack-only, and Next 16 builds with Turbopack by default. Configurator
 * mode instead bundles the service worker as a separate step after `next build`, which keeps the
 * Turbopack build intact. See the `build` script in package.json.
 */
export default serwist.withNextConfig((nextConfig) => ({
  swSrc: 'src/app/sw.ts',
  swDest: `${nextConfig.distDir}/../public/sw.js`,
  globDirectory: nextConfig.distDir,
}))
