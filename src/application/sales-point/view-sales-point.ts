import type { Artisan } from '@/domain/artisan/artisan'
import type { SalesPoint, SalesPointId } from '@/domain/sales-point/sales-point'
import { domainError, err, ok, type Result } from '@/domain/shared/result'

import type { ArtisanRepository } from '../ports/artisan.repository'
import type { SalesPointRepository } from '../ports/sales-point.repository'

export type ViewSalesPointOutput = {
  readonly salesPoint: SalesPoint
  /** Everyone currently selling there. Empty is a normal state, not an error. */
  readonly artisans: readonly Artisan[]
}

export const SALES_POINT_NOT_FOUND = 'sales_point.not_found'

/**
 * The public page of a place to buy: what the visitor reaches from a result card, and the page
 * that answers "who will I find if I go there".
 */
export class ViewSalesPoint {
  constructor(
    private readonly salesPoints: SalesPointRepository,
    private readonly artisans: ArtisanRepository,
  ) {}

  async execute(id: SalesPointId): Promise<Result<ViewSalesPointOutput>> {
    const salesPoint = await this.salesPoints.findById(id)

    if (!salesPoint) {
      return err(domainError(SALES_POINT_NOT_FOUND, 'Este ponto de venda não foi encontrado.'))
    }

    const artisans = await this.artisans.findBySalesPoint(salesPoint.id)

    return ok({ salesPoint, artisans })
  }
}
