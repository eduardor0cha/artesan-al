import type { Artisan, ArtisanId } from '@/domain/artisan/artisan'
import type { Product, ProductId } from '@/domain/product/product'
import type { NearbySalesPoint, SalesPoint, SalesPointId } from '@/domain/sales-point/sales-point'

import type { ArtisanRepository } from '../ports/artisan.repository'
import type { ImageStorage, StoredImage } from '../ports/image-storage'
import type { ProductRepository } from '../ports/product.repository'
import type { SalesPointRepository } from '../ports/sales-point.repository'

/**
 * In-memory ports for the unit tests of the read use cases. They hold plain arrays: a use case is
 * only worth testing here for the orchestration it does, and a mocking library would hide exactly
 * that. The database behaviour these stand in for is covered by the integration tests.
 */

export class FakeArtisanRepository implements ArtisanRepository {
  constructor(
    private readonly artisans: Artisan[] = [],
    /** Which artisans sell at each point, keyed by sales point id. */
    private readonly sellersByPoint: Record<string, Artisan[]> = {},
  ) {}

  findById(id: ArtisanId): Promise<Artisan | null> {
    return Promise.resolve(this.artisans.find((artisan) => artisan.id === id) ?? null)
  }

  findBySlug(slug: string): Promise<Artisan | null> {
    return Promise.resolve(this.artisans.find((artisan) => artisan.slug === slug) ?? null)
  }

  findByCpf(): Promise<Artisan | null> {
    return Promise.resolve(null)
  }

  findBySalesPoint(salesPointId: SalesPointId): Promise<Artisan[]> {
    return Promise.resolve(this.sellersByPoint[salesPointId] ?? [])
  }

  save(artisan: Artisan): Promise<void> {
    this.artisans.push(artisan)
    return Promise.resolve()
  }
}

export class FakeProductRepository implements ProductRepository {
  constructor(private readonly products: Product[] = []) {}

  findById(id: ProductId): Promise<Product | null> {
    return Promise.resolve(this.products.find((product) => product.id === id) ?? null)
  }

  findByArtisan(artisanId: ArtisanId): Promise<Product[]> {
    return Promise.resolve(this.products.filter((product) => product.artisanId === artisanId))
  }

  findBySalesPoint(): Promise<Product[]> {
    return Promise.resolve([])
  }

  save(product: Product): Promise<void> {
    this.products.push(product)
    return Promise.resolve()
  }

  delete(): Promise<void> {
    return Promise.resolve()
  }
}

export class FakeSalesPointRepository implements SalesPointRepository {
  constructor(
    private readonly salesPoints: SalesPoint[] = [],
    /** Where each artisan sells, keyed by artisan id. */
    private readonly pointsByArtisan: Record<string, SalesPoint[]> = {},
  ) {}

  findNearby(): Promise<NearbySalesPoint[]> {
    return Promise.resolve([])
  }

  findById(id: SalesPointId): Promise<SalesPoint | null> {
    return Promise.resolve(this.salesPoints.find((salesPoint) => salesPoint.id === id) ?? null)
  }

  findByArtisan(artisanId: ArtisanId): Promise<SalesPoint[]> {
    return Promise.resolve(this.pointsByArtisan[artisanId] ?? [])
  }

  save(salesPoint: SalesPoint): Promise<void> {
    this.salesPoints.push(salesPoint)
    return Promise.resolve()
  }
}

/** Mirrors how `S3ImageStorage` builds a public URL, without reaching for configuration. */
export class FakeImageStorage implements ImageStorage {
  constructor(private readonly baseUrl = 'https://fotos.exemplo/artesanal') {}

  upload({ key }: { key: string }): Promise<StoredImage> {
    return Promise.resolve({ key })
  }

  delete(): Promise<void> {
    return Promise.resolve()
  }

  publicUrl(key: string): string {
    return `${this.baseUrl}/${key}`
  }
}
