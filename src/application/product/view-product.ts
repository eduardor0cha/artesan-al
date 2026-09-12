import type { Artisan } from '@/domain/artisan/artisan'
import type { ProductId } from '@/domain/product/product'
import type { SalesPoint } from '@/domain/sales-point/sales-point'
import { domainError, err, ok, type Result } from '@/domain/shared/result'

import type { ArtisanRepository } from '../ports/artisan.repository'
import type { ImageStorage } from '../ports/image-storage'
import type { ProductRepository } from '../ports/product.repository'
import type { SalesPointRepository } from '../ports/sales-point.repository'
import { PRODUCT_NOT_FOUND } from './artisan-product'
import { withPhoto, type ProductWithPhoto } from './product-with-photo'

export type ViewProductOutput = ProductWithPhoto & {
  readonly artisan: Artisan
  /** Where the piece can be bought: the points where its maker currently sells. */
  readonly salesPoints: readonly SalesPoint[]
}

/**
 * A single piece, on the page whose link gets pasted into a conversation. It carries who made it
 * and where to buy it, because the system divulges craft rather than selling it (ADR 0011).
 */
export class ViewProduct {
  constructor(
    private readonly products: ProductRepository,
    private readonly artisans: ArtisanRepository,
    private readonly salesPoints: SalesPointRepository,
    private readonly images: ImageStorage,
  ) {}

  async execute(id: ProductId): Promise<Result<ViewProductOutput>> {
    const product = await this.products.findById(id)

    if (!product) {
      return err(domainError(PRODUCT_NOT_FOUND, 'Esta peça não foi encontrada.'))
    }

    const artisan = await this.artisans.findById(product.artisanId)

    if (!artisan) {
      // A product outlives its artisan only if a row was written outside this application: the
      // foreign key cascades. Treated as missing rather than shown without a maker.
      return err(domainError(PRODUCT_NOT_FOUND, 'Esta peça não foi encontrada.'))
    }

    const salesPoints = await this.salesPoints.findByArtisan(artisan.id)

    return ok({ ...withPhoto(product, this.images), artisan, salesPoints })
  }
}
