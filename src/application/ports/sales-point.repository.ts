import type { Coordinates } from '@/domain/sales-point/coordinates'
import type { NearbySalesPoint, SalesPoint, SalesPointId } from '@/domain/sales-point/sales-point'
import type { SearchRadius } from '@/domain/sales-point/search-radius'

export type NearbySearch = {
  center: Coordinates
  radius: SearchRadius
  limit?: number
}

export interface SalesPointRepository {
  /**
   * Ordered by distance, nearest first. Serves both the public search and the duplicate check
   * shown before an artisan creates a new point.
   */
  findNearby(search: NearbySearch): Promise<NearbySalesPoint[]>

  findById(id: SalesPointId): Promise<SalesPoint | null>

  save(salesPoint: SalesPoint): Promise<void>
}
