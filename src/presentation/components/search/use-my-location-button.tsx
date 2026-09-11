'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/presentation/components/ui/button'
import { buildSearchHref } from '@/presentation/lib/search-url'
import { messages } from '@/presentation/messages/pt-BR'

type UseMyLocationButtonProps = {
  /** Kept so that asking "where am I" does not silently reset the distance the visitor chose. */
  radiusKilometers: number
}

export function UseMyLocationButton({ radiusKilometers }: UseMyLocationButtonProps) {
  const router = useRouter()
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function locate() {
    if (!('geolocation' in navigator)) {
      setError(messages.search.locationUnsupported)
      return
    }

    setError(null)
    setLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        router.push(
          buildSearchHref({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            radiusKilometers,
          }),
        )
        // Navigation replaces the page, so the button stays busy until it does.
      },
      () => {
        setLocating(false)
        setError(messages.search.locationDenied)
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" onClick={locate} disabled={locating}>
        {locating ? messages.search.locating : messages.search.useMyLocation}
      </Button>

      {/* Announced when it appears: the failure happens long after the tap that caused it. */}
      <p role="status" className="text-stone-700">
        {error}
      </p>
    </div>
  )
}
