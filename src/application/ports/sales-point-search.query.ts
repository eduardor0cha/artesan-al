import type { Coordinates } from '@/domain/sales-point/coordinates'
import type { SalesPoint } from '@/domain/sales-point/sales-point'
import type { SearchRadius } from '@/domain/sales-point/search-radius'

/**
 * What a result card on the search screen needs, and nothing else. The visitor is choosing where
 * to go, so a point is only useful alongside how far it is and who sells there.
 */
export type NearbySalesPointSummary = {
  readonly salesPoint: SalesPoint
  readonly distanceMeters: number
  /** At most three names, alphabetical. The card has no room for a longer list. */
  readonly artisanNames: readonly string[]
  /** Everyone currently selling at the point, including the names above. */
  readonly artisanCount: number
}

export type NearbySalesPointSearch = {
  center: Coordinates
  radius: SearchRadius
  limit?: number
}

/**
 * A read model of its own rather than another method on `SalesPointRepository`: the repository's
 * `findNearby` also answers the duplicate check an artisan sees before creating a point, and that
 * needs neither the artisan names nor the count. Keeping them apart stops one from bloating for
 * the sake of the other.
 */
export interface SalesPointSearchQuery {
  findNearby(search: NearbySalesPointSearch): Promise<NearbySalesPointSummary[]>
}
