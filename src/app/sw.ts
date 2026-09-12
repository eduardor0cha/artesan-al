import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

/** A week: long enough to help someone who lost signal, short enough that a price is not stale. */
const PUBLIC_PAGE_MAX_AGE = 7 * 24 * 60 * 60

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    /**
     * Nothing under the panel is ever written to a cache. It is one artisan's own account, and
     * phones in this audience are shared — a page kept on disk would be shown to whoever opens the
     * app next, before any session check has run.
     */
    {
      matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/painel'),
      handler: new NetworkOnly(),
    },
    /**
     * The public screens, in a cache of their own. `defaultCache` would keep them too, but in a
     * 32-entry bucket shared with every other same-origin request: the search, a point, an artisan
     * and their pieces are more pages than that in one sitting.
     */
    {
      matcher: ({ sameOrigin, request, url }) =>
        sameOrigin && request.mode === 'navigate' && !url.pathname.startsWith('/api/'),
      handler: new NetworkFirst({
        cacheName: 'public-pages',
        // A slow connection is the normal case here; the cached page beats waiting indefinitely.
        networkTimeoutSeconds: 10,
        plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: PUBLIC_PAGE_MAX_AGE })],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
})

serwist.addEventListeners()
