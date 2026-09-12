'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

import { Button } from '@/presentation/components/ui/button'
import { SEARCH_PARAM } from '@/presentation/lib/search-url'
import { messages } from '@/presentation/messages/pt-BR'

const PinMap = dynamic(() => import('./pin-leaflet-map'), {
  ssr: false,
  loading: () => (
    <p className="flex h-64 items-center justify-center rounded-lg border border-stone-300 text-stone-600 lg:h-80">
      {messages.search.map.loading}
    </p>
  ),
})

type LocationPickerProps = {
  /** Where the pin starts: the artisan's last choice, or the default centre. */
  latitude: number
  longitude: number
  /** The screen the confirmed coordinates are sent to, as a plain GET. */
  action: string
}

/**
 * Choosing a spot, and handing it to the server the same way the public search does: in the query
 * string. That keeps what follows — the list of points already registered there — server-rendered
 * and reloadable, instead of held in the memory of this component.
 */
export function LocationPicker({ latitude, longitude, action }: LocationPickerProps) {
  const [position, setPosition] = useState({ latitude, longitude })
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setLocationError(messages.search.locationUnsupported)
      return
    }

    setLocationError(null)
    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      (found) => {
        setPosition({ latitude: found.coords.latitude, longitude: found.coords.longitude })
        setLocating(false)
      },
      () => {
        setLocating(false)
        setLocationError(messages.search.locationDenied)
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  return (
    <form method="get" action={action} className="flex flex-col gap-4">
      <p className="text-stone-700">{messages.panel.newSalesPoint.pickLocationHelp}</p>

      {/* The map is what sets these; without it there is no honest value to submit. */}
      <noscript>
        <p className="rounded-lg border border-stone-300 bg-stone-100 p-4 text-stone-800">
          {messages.panel.newSalesPoint.needsJavaScript}
        </p>
      </noscript>

      <input type="hidden" name={SEARCH_PARAM.latitude} value={position.latitude} />
      <input type="hidden" name={SEARCH_PARAM.longitude} value={position.longitude} />

      <PinMap latitude={position.latitude} longitude={position.longitude} onMove={setPosition} />

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={useMyLocation} disabled={locating}>
          {locating ? messages.search.locating : messages.search.useMyLocation}
        </Button>

        <Button type="submit" size="large">
          {messages.panel.newSalesPoint.confirmLocation}
        </Button>
      </div>

      {/* Announced when it appears: the failure lands long after the tap that caused it. */}
      <p role="status" className="text-stone-700">
        {locationError}
      </p>
    </form>
  )
}
