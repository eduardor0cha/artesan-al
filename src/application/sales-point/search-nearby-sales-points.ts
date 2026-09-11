import { Coordinates } from '@/domain/sales-point/coordinates'
import { SearchRadius } from '@/domain/sales-point/search-radius'
import { ok, type Result } from '@/domain/shared/result'

import type {
  NearbySalesPointSummary,
  SalesPointSearchQuery,
} from '../ports/sales-point-search.query'

/**
 * Maceió's centre. A visitor who has not shared their location still has to see something, and the
 * capital is where most of them are.
 */
export const DEFAULT_SEARCH_CENTER = { latitude: -9.6658, longitude: -35.7353 } as const

/**
 * One screen's worth of results. Beyond this the list stops being readable and the payload starts
 * to matter on a slow connection; widening or narrowing the radius is the way to see other points.
 */
export const MAX_SEARCH_RESULTS = 50

export type SearchNearbySalesPointsInput = {
  latitude?: number
  longitude?: number
  radiusKilometers?: number
}

export type SearchNearbySalesPointsOutput = {
  /** Echoed back because it may be the default: the screen needs to know what it actually searched. */
  readonly center: Coordinates
  readonly radius: SearchRadius
  readonly salesPoints: readonly NearbySalesPointSummary[]
}

/**
 * The public search: where can I find craft near me. Input arrives from the query string, so every
 * value is validated by the domain before it can reach a spatial query.
 */
export class SearchNearbySalesPoints {
  constructor(private readonly salesPointSearch: SalesPointSearchQuery) {}

  async execute(
    input: SearchNearbySalesPointsInput,
  ): Promise<Result<SearchNearbySalesPointsOutput>> {
    const center = Coordinates.create(
      input.latitude ?? DEFAULT_SEARCH_CENTER.latitude,
      input.longitude ?? DEFAULT_SEARCH_CENTER.longitude,
    )

    if (!center.ok) return center

    const radius: Result<SearchRadius> =
      input.radiusKilometers === undefined
        ? ok(SearchRadius.default())
        : SearchRadius.create(input.radiusKilometers)

    if (!radius.ok) return radius

    const salesPoints = await this.salesPointSearch.findNearby({
      center: center.value,
      radius: radius.value,
      limit: MAX_SEARCH_RESULTS,
    })

    return ok({ center: center.value, radius: radius.value, salesPoints })
  }
}
