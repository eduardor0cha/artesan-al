import { serwist } from '@serwist/next/config'

/**
 * Serwist's Next plugin is webpack-only, and Next 16 builds with Turbopack by default. Configurator
 * mode instead bundles the service worker as a separate step after `next build`, which keeps the
 * Turbopack build intact. See the `build` script in package.json.
 *
 * `globDirectory` is deliberately left alone: it defaults to the working directory, and the glob
 * patterns Serwist derives are already prefixed with `distDir`. Pointing it at `.next` made every
 * pattern read `.next/.next/...`, which matched nothing — the service worker then shipped with an
 * empty precache and the offline fallback had no page to fall back to.
 */
export default serwist.withNextConfig((nextConfig) => ({
  swSrc: 'src/app/sw.ts',
  swDest: `${nextConfig.distDir}/../public/sw.js`,
}))
