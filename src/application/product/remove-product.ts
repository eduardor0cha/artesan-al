import type { ArtisanId } from '@/domain/artisan/artisan'
import type { Product, ProductId } from '@/domain/product/product'
import { ok, type Result } from '@/domain/shared/result'

import type { ImageStorage } from '../ports/image-storage'
import type { ProductRepository } from '../ports/product.repository'
import { findOwnProduct } from './artisan-product'
import { forgetPhotos } from './product-input'

export type RemoveProductInput = {
  artisanId: ArtisanId
  productId: ProductId
}

/**
 * Taking a piece off the catalogue. It is a real deletion rather than a hidden flag: the artisan
 * owns what is shown in their name, and a piece that was sold or withdrawn has no reason to stay
 * on a page a visitor might reach from a shared link.
 */
export class RemoveProduct {
  constructor(
    private readonly products: ProductRepository,
    private readonly images: ImageStorage,
  ) {}

  async execute(input: RemoveProductInput): Promise<Result<Product>> {
    const product = await findOwnProduct(this.products, input.artisanId, input.productId)
    if (!product.ok) return product

    await this.products.delete(product.value.id)
    await forgetPhotos(
      this.images,
      product.value.images.map((image) => image.storageKey),
    )

    return ok(product.value)
  }
}
