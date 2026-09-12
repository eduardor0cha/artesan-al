import type { ArtisanId } from '@/domain/artisan/artisan'
import type { Product } from '@/domain/product/product'
import { ok, type Result } from '@/domain/shared/result'

import type { ImageStorage } from '../ports/image-storage'
import type { ProductRepository } from '../ports/product.repository'
import {
  readProductDetails,
  storePhoto,
  type PhotoUpload,
  type ProductDetailsInput,
} from './product-input'

export type PublishProductInput = ProductDetailsInput & {
  artisanId: ArtisanId
  /** Optional: a piece can be published while the artisan is somewhere with no light for a photo. */
  photo?: PhotoUpload
}

/**
 * Putting a piece in the catalogue. The photo goes to the object store before the row is written,
 * so a product never exists pointing at bytes that were never uploaded.
 */
export class PublishProduct {
  constructor(
    private readonly products: ProductRepository,
    private readonly images: ImageStorage,
  ) {}

  async execute(input: PublishProductInput): Promise<Result<Product>> {
    const details = readProductDetails(input)
    if (!details.ok) return details

    const image = input.photo ? await storePhoto(input.photo, this.images) : null
    if (image && !image.ok) return image

    const product: Product = {
      id: crypto.randomUUID(),
      artisanId: input.artisanId,
      name: details.value.name,
      description: details.value.description,
      price: details.value.price,
      images: image ? [image.value] : [],
      createdAt: new Date(),
    }

    await this.products.save(product)

    return ok(product)
  }
}
