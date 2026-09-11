import type { ArtisanId } from '@/domain/artisan/artisan'
import type { Product, ProductId } from '@/domain/product/product'

export interface ProductRepository {
  findById(id: ProductId): Promise<Product | null>

  findByArtisan(artisanId: ArtisanId): Promise<Product[]>

  /** Catalogue of everyone who sells at a given point, for the sales point page. */
  findBySalesPoint(salesPointId: string): Promise<Product[]>

  save(product: Product): Promise<void>

  delete(id: ProductId): Promise<void>
}
