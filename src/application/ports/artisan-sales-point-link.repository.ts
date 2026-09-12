import type { ArtisanId } from '@/domain/artisan/artisan'
import type { SalesPointId } from '@/domain/sales-point/sales-point'

/**
 * The link between an artisan and a place they sell. A port of its own rather than more methods on
 * `SalesPointRepository`: a point exists whether or not anyone sells there, and the link carries a
 * validity the point knows nothing about.
 */
export interface ArtisanSalesPointLinkRepository {
  /**
   * Records that the artisan sells there from today. Doing it twice leaves one current link, not
   * two seasons of the same thing.
   */
  link(artisanId: ArtisanId, salesPointId: SalesPointId): Promise<void>
}
