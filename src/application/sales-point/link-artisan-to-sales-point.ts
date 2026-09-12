import type { ArtisanId } from '@/domain/artisan/artisan'
import type { SalesPoint, SalesPointId } from '@/domain/sales-point/sales-point'
import { domainError, err, ok, type Result } from '@/domain/shared/result'

import type { ArtisanSalesPointLinkRepository } from '../ports/artisan-sales-point-link.repository'
import type { SalesPointRepository } from '../ports/sales-point.repository'
import { SALES_POINT_NOT_FOUND } from './view-sales-point'

export type LinkArtisanToSalesPointInput = {
  artisanId: ArtisanId
  salesPointId: SalesPointId
}

/**
 * What "I sell at this fair too" does. The point id comes from a form, so the point is read back
 * before the link is written: an id that no longer exists is a stale page, not a database error.
 */
export class LinkArtisanToSalesPoint {
  constructor(
    private readonly salesPoints: SalesPointRepository,
    private readonly links: ArtisanSalesPointLinkRepository,
  ) {}

  async execute(input: LinkArtisanToSalesPointInput): Promise<Result<SalesPoint>> {
    const salesPoint = await this.salesPoints.findById(input.salesPointId)

    if (!salesPoint) {
      return err(domainError(SALES_POINT_NOT_FOUND, 'Este ponto de venda não foi encontrado.'))
    }

    await this.links.link(input.artisanId, salesPoint.id)

    return ok(salesPoint)
  }
}
