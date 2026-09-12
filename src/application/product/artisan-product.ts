import type { ArtisanId } from '@/domain/artisan/artisan'
import type { Product, ProductId } from '@/domain/product/product'
import { domainError, err, ok, type Result } from '@/domain/shared/result'

import type { ProductRepository } from '../ports/product.repository'

export const PRODUCT_NOT_FOUND = 'product.not_found'
export const PRODUCT_NOT_YOURS = 'product.not_yours'

/**
 * The piece as the artisan who made it reaches it. Every write in the panel starts here, because a
 * Server Action is reachable by a direct POST: the id in the form is as untrusted as the rest of
 * it, and the only thing that ties it to whoever is signed in is this lookup (ADR 0009).
 */
export async function findOwnProduct(
  products: ProductRepository,
  artisanId: ArtisanId,
  productId: ProductId,
): Promise<Result<Product>> {
  const product = await products.findById(productId)

  if (!product) {
    return err(domainError(PRODUCT_NOT_FOUND, 'Esta peça não foi encontrada.'))
  }

  if (product.artisanId !== artisanId) {
    return err(domainError(PRODUCT_NOT_YOURS, 'Esta peça é de outro artesão.'))
  }

  return ok(product)
}
