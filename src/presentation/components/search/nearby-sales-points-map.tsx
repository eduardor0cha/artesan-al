'use client'

import dynamic from 'next/dynamic'

import { messages } from '@/presentation/messages/pt-BR'

import type { NearbySalesPointsMapProps } from './map-types'

/**
 * Leaflet measures the container and touches `window` while mounting, so it cannot be rendered on
 * the server. `ssr: false` is only allowed inside a Client Component, which is all this wrapper
 * exists for — the page beside it stays a Server Component.
 */
const LeafletMap = dynamic(() => import('./nearby-sales-points-leaflet-map'), {
  ssr: false,
  loading: () => (
    <p className="flex h-72 items-center justify-center rounded-lg border border-stone-300 text-stone-600 lg:h-[32rem]">
      {messages.search.map.loading}
    </p>
  ),
})

export function NearbySalesPointsMap(props: NearbySalesPointsMapProps) {
  return <LeafletMap {...props} />
}
