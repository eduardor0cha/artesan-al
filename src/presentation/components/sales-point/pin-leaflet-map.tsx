'use client'

import 'leaflet/dist/leaflet.css'

import { divIcon } from 'leaflet'
import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents, ZoomControl } from 'react-leaflet'

import { messages } from '@/presentation/messages/pt-BR'

import type { PinMapProps } from './pin-map-types'

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

/** Close enough to tell one stall from the next, which is the precision this screen asks for. */
const ZOOM = 17

/**
 * One pin the artisan places on the spot where they sell. Dragging it is the quick way; tapping
 * anywhere on the map moves it too, which is what works for someone whose finger does not land
 * where they meant. Neither is the only way in: the button beside the map reads the GPS, and both
 * feed the same pair of coordinates.
 */
export default function PinLeafletMap({ latitude, longitude, onMove }: PinMapProps) {
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
      aria-label={messages.panel.newSalesPoint.mapLabel}
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

        <Marker
          position={[latitude, longitude]}
          icon={pinIcon}
          draggable
          keyboard={false}
          eventHandlers={{
            dragend: (event) => {
              const { lat, lng } = event.target.getLatLng()
              onMove({ latitude: lat, longitude: lng })
            },
          }}
        />

        <MoveOnTap onMove={onMove} />
        <FollowPin latitude={latitude} longitude={longitude} />
      </MapContainer>
    </div>
  )
}

function MoveOnTap({ onMove }: Pick<PinMapProps, 'onMove'>) {
  useMapEvents({
    click: (event) => onMove({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
  })

  return null
}

/**
 * `MapContainer`'s centre is read once, when it mounts, so the map has to be told to follow a pin
 * that moved from outside it — which is what "use my location" does.
 */
function FollowPin({ latitude, longitude }: Omit<PinMapProps, 'onMove'>) {
  const map = useMap()

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom())
  }, [map, latitude, longitude])

  return null
}
