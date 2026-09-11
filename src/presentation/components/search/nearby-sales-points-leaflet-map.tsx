'use client'

import 'leaflet/dist/leaflet.css'

import { divIcon, type Map as LeafletMap } from 'leaflet'
import { useRouter } from 'next/navigation'
import { useMemo, useRef } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, ZoomControl } from 'react-leaflet'

import { Button } from '@/presentation/components/ui/button'
import { formatDistance } from '@/presentation/lib/format-distance'
import { buildSearchHref } from '@/presentation/lib/search-url'
import { messages } from '@/presentation/messages/pt-BR'

import type { MapSalesPoint, NearbySalesPointsMapProps } from './map-types'

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

/** Close enough to read street names on a phone without hiding the neighbouring points. */
const INITIAL_ZOOM = 12

/**
 * The map is a second way to read the same results, never the only one: the list beside it is
 * server-rendered and remains the accessible source of truth. That is also why the markers are
 * kept out of the tab order — tabbing through fifty pins to reach content already in the list
 * would be worse than not having them there.
 */
export default function NearbySalesPointsLeafletMap({
  center,
  radiusKilometers,
  salesPoints,
}: NearbySalesPointsMapProps) {
  const router = useRouter()
  const mapRef = useRef<LeafletMap | null>(null)

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

  function searchThisArea() {
    const mapCenter = mapRef.current?.getCenter()
    if (!mapCenter) return

    router.push(
      buildSearchHref({
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        radiusKilometers,
      }),
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="region"
        aria-label={messages.search.map.label}
        className="h-72 overflow-hidden rounded-lg border border-stone-300 lg:h-[32rem]"
      >
        <MapContainer
          ref={mapRef}
          center={[center.latitude, center.longitude]}
          zoom={INITIAL_ZOOM}
          zoomControl={false}
          className="h-full w-full"
        >
          <TileLayer url={TILE_URL} attribution={messages.search.map.attribution} />
          <ZoomControl
            position="topright"
            zoomInTitle={messages.search.map.zoomIn}
            zoomOutTitle={messages.search.map.zoomOut}
          />

          <Circle
            center={[center.latitude, center.longitude]}
            radius={radiusKilometers * 1000}
            pathOptions={{ color: '#1f6f4a', weight: 1, fillOpacity: 0.06 }}
          />

          {salesPoints.map((salesPoint) => (
            <Marker
              key={salesPoint.id}
              position={[salesPoint.latitude, salesPoint.longitude]}
              icon={pinIcon}
              keyboard={false}
            >
              <Popup>{popupText(salesPoint)}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" variant="secondary" onClick={searchThisArea}>
          {messages.search.searchThisArea}
        </Button>
        <p className="text-sm text-stone-600">{messages.search.map.listIsEquivalent}</p>
      </div>
    </div>
  )
}

function popupText(salesPoint: MapSalesPoint): string {
  const distance = messages.salesPoint.distanceAway(formatDistance(salesPoint.distanceMeters))
  return `${salesPoint.name} — ${distance}`
}
