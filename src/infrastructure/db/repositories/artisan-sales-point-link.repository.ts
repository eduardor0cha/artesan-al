import { and, eq, isNull } from 'drizzle-orm'

import type { ArtisanSalesPointLinkRepository } from '@/application/ports/artisan-sales-point-link.repository'
import type { ArtisanId } from '@/domain/artisan/artisan'
import type { SalesPointId } from '@/domain/sales-point/sales-point'

import type { Database } from '../client'
import { artisanSalesPoints } from '../schema/sales-points'

export class DrizzleArtisanSalesPointLinkRepository implements ArtisanSalesPointLinkRepository {
  constructor(private readonly db: Database) {}

  /**
   * The primary key includes `startsOn`, so inserting twice would record two seasons at the same
   * fair instead of failing. Reading the current link first is what makes "I sell here" safe to
   * tap twice on a slow connection.
   */
  async link(artisanId: ArtisanId, salesPointId: SalesPointId): Promise<void> {
    const current = await this.db
      .select({ artisanId: artisanSalesPoints.artisanId })
      .from(artisanSalesPoints)
      .where(
        and(
          eq(artisanSalesPoints.artisanId, artisanId),
          eq(artisanSalesPoints.salesPointId, salesPointId),
          // A null end date is what marks a link as current; past seasons stay as history.
          isNull(artisanSalesPoints.endsOn),
        ),
      )
      .limit(1)

    if (current.length > 0) return

    await this.db.insert(artisanSalesPoints).values({ artisanId, salesPointId })
  }
}
