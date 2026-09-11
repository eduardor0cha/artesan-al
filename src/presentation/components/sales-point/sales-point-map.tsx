'use client'

import dynamic from 'next/dynamic'

import { messages } from '@/presentation/messages/pt-BR'

import type { SalesPointMapProps } from './sales-point-map-types'

/**
 * Same reason as the search map: Leaflet touches `window` while mounting, and `ssr: false` is only
 * allowed inside a Client Component. This wrapper exists so the page beside it stays a Server
 * Component.
 */
const LeafletMap = dynamic(() => import('./sales-point-leaflet-map'), {
  ssr: false,
  loading: () => (
    <p className="flex h-64 items-center justify-center rounded-lg border border-stone-300 text-stone-600">
      {messages.search.map.loading}
    </p>
  ),
})

export function SalesPointMap(props: SalesPointMapProps) {
  return <LeafletMap {...props} />
}
