import type { ArtisanId } from '../artisan/artisan'
import type { Price } from './price'

export type ProductId = string

export type ProductImage = {
  readonly id: string
  /** Key in the object store, not a URL: the public URL is built from the storage configuration. */
  readonly storageKey: string
  readonly alt: string
  readonly position: number
}

export type Product = {
  readonly id: ProductId
  readonly artisanId: ArtisanId
  readonly name: string
  readonly description: string | null
  readonly price: Price | null
  readonly images: readonly ProductImage[]
  readonly createdAt: Date
}
