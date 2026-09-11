import type { Product } from '@/domain/product/product'

import type { ImageStorage } from '../ports/image-storage'

export type ProductPhoto = {
  readonly url: string
  readonly alt: string
}

/**
 * A product as the public pages show it. The MVP displays a single photo per piece, so the whole
 * image list is reduced to the first position here instead of in every component that renders one.
 */
export type ProductWithPhoto = {
  readonly product: Product
  /** Null while the artisan has not uploaded a photo yet; the page shows a placeholder. */
  readonly photo: ProductPhoto | null
}

/**
 * Resolves the stored key into an address the browser can fetch. Only storage knows how to build
 * it, which is why the URL is never persisted alongside the product.
 */
export function withPhoto(product: Product, images: ImageStorage): ProductWithPhoto {
  const cover = [...product.images].sort((a, b) => a.position - b.position).at(0)

  return {
    product,
    photo: cover ? { url: images.publicUrl(cover.storageKey), alt: cover.alt } : null,
  }
}
