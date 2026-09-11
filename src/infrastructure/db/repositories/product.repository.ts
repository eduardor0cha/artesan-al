import { and, asc, desc, eq, isNull } from 'drizzle-orm'

import type { ProductRepository } from '@/application/ports/product.repository'
import type { ArtisanId } from '@/domain/artisan/artisan'
import { Price } from '@/domain/product/price'
import type { Product, ProductId, ProductImage } from '@/domain/product/product'
import type { SalesPointId } from '@/domain/sales-point/sales-point'

import type { Database } from '../client'
import { artisans } from '../schema/artisans'
import { productImages, products } from '../schema/products'
import { artisanSalesPoints } from '../schema/sales-points'

type ProductRow = typeof products.$inferSelect
type ProductImageRow = typeof productImages.$inferSelect

/** One row per product/image pair: a product with no photo still comes back, with a null image. */
type JoinedRow = { product: ProductRow; image: ProductImageRow | null }

export class DrizzleProductRepository implements ProductRepository {
  constructor(private readonly db: Database) {}

  async findById(id: ProductId): Promise<Product | null> {
    const rows = await this.selectWithImages().where(eq(products.id, id))

    return group(rows).at(0) ?? null
  }

  async findByArtisan(artisanId: ArtisanId): Promise<Product[]> {
    const rows = await this.selectWithImages()
      .where(eq(products.artisanId, artisanId))
      .orderBy(desc(products.createdAt), asc(productImages.position))

    return group(rows)
  }

  /**
   * The whole catalogue on offer at a place: everything published by the artisans who currently
   * sell there. A link that has ended takes its products off the point's page with it.
   */
  async findBySalesPoint(salesPointId: SalesPointId): Promise<Product[]> {
    const rows = await this.db
      .select({ product: products, image: productImages })
      .from(products)
      .innerJoin(artisans, eq(artisans.id, products.artisanId))
      .innerJoin(
        artisanSalesPoints,
        and(
          eq(artisanSalesPoints.artisanId, artisans.id),
          eq(artisanSalesPoints.salesPointId, salesPointId),
          isNull(artisanSalesPoints.endsOn),
        ),
      )
      .leftJoin(productImages, eq(productImages.productId, products.id))
      .orderBy(asc(artisans.name), desc(products.createdAt), asc(productImages.position))

    return group(rows)
  }

  async save(product: Product): Promise<void> {
    const values = {
      id: product.id,
      artisanId: product.artisanId,
      name: product.name,
      description: product.description,
      priceCents: product.price?.cents ?? null,
    }

    // The image list is replaced wholesale rather than reconciled row by row: a piece carries a
    // handful of photos, and a partial write would leave the catalogue showing the wrong one.
    await this.db.transaction(async (tx) => {
      await tx
        .insert(products)
        .values(values)
        .onConflictDoUpdate({ target: products.id, set: values })

      await tx.delete(productImages).where(eq(productImages.productId, product.id))

      if (product.images.length > 0) {
        await tx.insert(productImages).values(
          product.images.map((image) => ({
            id: image.id,
            productId: product.id,
            storageKey: image.storageKey,
            alt: image.alt,
            position: image.position,
          })),
        )
      }
    })
  }

  async delete(id: ProductId): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id))
  }

  private selectWithImages() {
    return this.db
      .select({ product: products, image: productImages })
      .from(products)
      .leftJoin(productImages, eq(productImages.productId, products.id))
  }
}

/** Collapses the join back into one product per id, preserving the order the query returned. */
function group(rows: JoinedRow[]): Product[] {
  const byId = new Map<string, { product: ProductRow; images: ProductImage[] }>()

  for (const row of rows) {
    const entry = byId.get(row.product.id) ?? { product: row.product, images: [] }

    if (row.image) {
      entry.images.push({
        id: row.image.id,
        storageKey: row.image.storageKey,
        alt: row.image.alt,
        position: row.image.position,
      })
    }

    byId.set(row.product.id, entry)
  }

  return [...byId.values()].map(({ product, images }) => toProduct(product, images))
}

function toProduct(row: ProductRow, images: ProductImage[]): Product {
  return {
    id: row.id,
    artisanId: row.artisanId,
    name: row.name,
    description: row.description,
    price: toPrice(row.priceCents, row.id),
    images: [...images].sort((a, b) => a.position - b.position),
    createdAt: row.createdAt,
  }
}

function toPrice(cents: number | null, productId: string): Price | null {
  if (cents === null) return null

  const price = Price.create(cents)

  if (!price.ok) {
    // Prices are validated before being stored, so a failure here means the row was written by
    // something other than this application.
    throw new Error(`Produto ${productId} tem preço inválido no banco.`)
  }

  return price.value
}
