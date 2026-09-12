import type { ArtisanId } from '@/domain/artisan/artisan'
import type { Product, ProductId } from '@/domain/product/product'
import { ok, type Result } from '@/domain/shared/result'

import type { ImageStorage } from '../ports/image-storage'
import type { ProductRepository } from '../ports/product.repository'
import { findOwnProduct } from './artisan-product'
import {
  forgetPhotos,
  readAlt,
  readProductDetails,
  storePhoto,
  type PhotoUpload,
  type ProductDetailsInput,
} from './product-input'

export type UpdateProductInput = ProductDetailsInput & {
  artisanId: ArtisanId
  productId: ProductId
  /** Only when the artisan chose a new file; otherwise the photo already stored is kept. */
  photo?: PhotoUpload
  /** The description of the photo, editable on its own — a wording is often fixed without a retake. */
  alt?: string
}

/**
 * Correcting a piece already published: a price that changed, a name that was mistyped, a photo
 * taken again with better light.
 */
export class UpdateProduct {
  constructor(
    private readonly products: ProductRepository,
    private readonly images: ImageStorage,
  ) {}

  async execute(input: UpdateProductInput): Promise<Result<Product>> {
    const existing = await findOwnProduct(this.products, input.artisanId, input.productId)
    if (!existing.ok) return existing

    const details = readProductDetails(input)
    if (!details.ok) return details

    const images = await this.nextImages(existing.value, input)
    if (!images.ok) return images

    const updated: Product = {
      ...existing.value,
      name: details.value.name,
      description: details.value.description,
      price: details.value.price,
      images: images.value,
    }

    await this.products.save(updated)

    // Only after the row no longer points at them: an orphan object is cheaper than a broken image.
    await forgetPhotos(this.images, replacedKeys(existing.value, updated))

    return ok(updated)
  }

  private async nextImages(
    existing: Product,
    input: UpdateProductInput,
  ): Promise<Result<Product['images']>> {
    if (input.photo) {
      const stored = await storePhoto(
        { ...input.photo, alt: input.alt ?? input.photo.alt },
        this.images,
      )

      return stored.ok ? ok([stored.value]) : stored
    }

    const current = existing.images.at(0)

    if (!current || input.alt === undefined) return ok(existing.images)

    const alt = readAlt(input.alt)
    if (!alt.ok) return alt

    return ok([{ ...current, alt: alt.value }])
  }
}

function replacedKeys(before: Product, after: Product): string[] {
  const kept = new Set(after.images.map((image) => image.storageKey))

  return before.images
    .map((image) => image.storageKey)
    .filter((storageKey) => !kept.has(storageKey))
}
