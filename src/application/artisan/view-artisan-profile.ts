import type { Artisan } from '@/domain/artisan/artisan'
import type { SalesPoint } from '@/domain/sales-point/sales-point'
import { domainError, err, ok, type Result } from '@/domain/shared/result'

import type { ArtisanRepository } from '../ports/artisan.repository'
import type { ImageStorage } from '../ports/image-storage'
import type { ProductRepository } from '../ports/product.repository'
import type { SalesPointRepository } from '../ports/sales-point.repository'
import { withPhoto, type ProductWithPhoto } from '../product/product-with-photo'

export type ViewArtisanProfileOutput = {
  readonly artisan: Artisan
  readonly products: readonly ProductWithPhoto[]
  /** Where to find them in person; the profile carries no address of its own (ADR 0003). */
  readonly salesPoints: readonly SalesPoint[]
}

export const ARTISAN_NOT_FOUND = 'artisan.not_found'

/**
 * The artisan's own page — the piece that gives the project its point: a maker with a story, a
 * craft and a catalogue, reachable at a link they can share.
 */
export class ViewArtisanProfile {
  constructor(
    private readonly artisans: ArtisanRepository,
    private readonly products: ProductRepository,
    private readonly salesPoints: SalesPointRepository,
    private readonly images: ImageStorage,
  ) {}

  async execute(slug: string): Promise<Result<ViewArtisanProfileOutput>> {
    const artisan = await this.artisans.findBySlug(slug)

    if (!artisan) {
      return err(domainError(ARTISAN_NOT_FOUND, 'Este artesão não foi encontrado.'))
    }

    const [products, salesPoints] = await Promise.all([
      this.products.findByArtisan(artisan.id),
      this.salesPoints.findByArtisan(artisan.id),
    ])

    return ok({
      artisan,
      products: products.map((product) => withPhoto(product, this.images)),
      salesPoints,
    })
  }
}
