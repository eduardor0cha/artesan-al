import type { ArtisanId } from '../artisan/artisan'
import type { Coordinates } from './coordinates'
import type { SalesPointType } from './sales-point-type'

export type SalesPointId = string

/**
 * Where craft is physically sold. This is the only geolocated entity in the model: an artisan is
 * found through the points where they sell, never through a home address.
 */
export type SalesPoint = {
  readonly id: SalesPointId
  readonly name: string
  readonly type: SalesPointType
  readonly coordinates: Coordinates
  /** Free text, for display only — fairs and workshops often have no usable street address. */
  readonly address: string | null
  readonly openingHours: string | null
  /** Whoever registered it. Shared points are reused by other artisans rather than duplicated. */
  readonly createdBy: ArtisanId
  readonly createdAt: Date
}

/** A sales point with its distance from the point the search started at. */
export type NearbySalesPoint = {
  readonly salesPoint: SalesPoint
  readonly distanceMeters: number
}
