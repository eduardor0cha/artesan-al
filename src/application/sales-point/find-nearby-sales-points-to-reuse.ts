import type { ArtisanId } from '@/domain/artisan/artisan'
import { Coordinates } from '@/domain/sales-point/coordinates'
import type { SalesPoint } from '@/domain/sales-point/sales-point'
import { SearchRadius } from '@/domain/sales-point/search-radius'
import { ok, type Result } from '@/domain/shared/result'

import type { SalesPointRepository } from '../ports/sales-point.repository'

/**
 * Walking distance, not driving distance. A fair is one already-registered place shared by dozens
 * of artisans (ADR 0004), so what has to be offered back is what stands where the artisan is
 * standing — wide enough for the drift of a phone's GPS, narrow enough that the shop across town
 * is not proposed as "the same point".
 */
export const REUSE_RADIUS_KM = 0.3

/** The screen is a short list to recognise something in, not a search result page. */
const MAX_CANDIDATES = 10

export type ReusableSalesPoint = {
  readonly salesPoint: SalesPoint
  readonly distanceMeters: number
  /** True when this artisan already sells there, so the screen offers nothing to do. */
  readonly alreadySelling: boolean
}

export type FindNearbySalesPointsToReuseInput = {
  artisanId: ArtisanId
  latitude: number
  longitude: number
}

/**
 * The first half of "where I sell": before anyone types a name, show what is already registered
 * right here. Duplicating a fair splits its artisans across two pins on the visitor's map, which
 * is the failure this screen exists to prevent.
 */
export class FindNearbySalesPointsToReuse {
  constructor(private readonly salesPoints: SalesPointRepository) {}

  async execute(
    input: FindNearbySalesPointsToReuseInput,
  ): Promise<Result<readonly ReusableSalesPoint[]>> {
    const center = Coordinates.create(input.latitude, input.longitude)
    if (!center.ok) return center

    const radius = SearchRadius.create(REUSE_RADIUS_KM)
    if (!radius.ok) return radius

    const [nearby, mine] = await Promise.all([
      this.salesPoints.findNearby({
        center: center.value,
        radius: radius.value,
        limit: MAX_CANDIDATES,
      }),
      this.salesPoints.findByArtisan(input.artisanId),
    ])

    const mineIds = new Set(mine.map((salesPoint) => salesPoint.id))

    return ok(
      nearby.map((found) => ({
        salesPoint: found.salesPoint,
        distanceMeters: found.distanceMeters,
        alreadySelling: mineIds.has(found.salesPoint.id),
      })),
    )
  }
}
