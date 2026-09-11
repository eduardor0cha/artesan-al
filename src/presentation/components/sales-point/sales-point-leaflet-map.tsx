'use client'

import 'leaflet/dist/leaflet.css'

import { divIcon } from 'leaflet'
import { useMemo } from 'react'
import { MapContainer, Marker, TileLayer, ZoomControl } from 'react-leaflet'

import { messages } from '@/presentation/messages/pt-BR'

import type { SalesPointMapProps } from './sales-point-map-types'

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

/** Closer than the search map: here the visitor is looking for the street, not for options. */
const ZOOM = 15

/**
 * Where this one point is. The address and the opening hours beside it carry the same information
 * in text, so nothing is lost when the map fails to load or cannot be seen — which is also why the
 * marker stays out of the tab order.
 */
export default function SalesPointLeafletMap({ name, latitude, longitude }: SalesPointMapProps) {
  const pinIcon = useMemo(
    () =>
      divIcon({
        className: 'artesanal-map-pin',
        html: '<span aria-hidden="true"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    [],
  )

  return (
    <div
      role="region"
      aria-label={messages.salesPoint.mapLabel}
      className="h-64 overflow-hidden rounded-lg border border-stone-300 lg:h-80"
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={ZOOM}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={messages.search.map.attribution} />
        <ZoomControl
          position="topright"
          zoomInTitle={messages.search.map.zoomIn}
          zoomOutTitle={messages.search.map.zoomOut}
        />
        <Marker position={[latitude, longitude]} icon={pinIcon} keyboard={false} title={name} />
      </MapContainer>
    </div>
  )
}
