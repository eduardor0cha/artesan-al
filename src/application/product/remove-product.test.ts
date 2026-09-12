import { describe, expect, it } from 'vitest'

import { FakeImageStorage, FakeProductRepository } from '../testing/fake-repositories'
import { aProduct, aProductImage } from '../testing/fixtures'
import { PRODUCT_NOT_YOURS } from './artisan-product'
import { RemoveProduct } from './remove-product'

const moringa = aProduct({
  id: 'product-1',
  artisanId: 'artisan-1',
  images: [aProductImage({ storageKey: 'produtos/moringa.jpg' })],
})

describe('RemoveProduct', () => {
  it('takes the piece off the catalogue and forgets its photo', async () => {
    const products = new FakeProductRepository([moringa])
    const images = new FakeImageStorage()

    const result = await new RemoveProduct(products, images).execute({
      artisanId: 'artisan-1',
      productId: 'product-1',
    })

    expect(result.ok && result.value.name).toBe('Moringa de barro')
    expect(products.products).toEqual([])
    expect(images.deleted).toEqual(['produtos/moringa.jpg'])
  })

  it('refuses to remove a piece made by someone else', async () => {
    const products = new FakeProductRepository([moringa])
    const images = new FakeImageStorage()

    const result = await new RemoveProduct(products, images).execute({
      artisanId: 'artisan-2',
      productId: 'product-1',
    })

    expect(!result.ok && result.error.code).toBe(PRODUCT_NOT_YOURS)
    expect(products.products).toHaveLength(1)
    expect(images.deleted).toEqual([])
  })

  it('reports a piece that is already gone', async () => {
    const result = await new RemoveProduct(
      new FakeProductRepository(),
      new FakeImageStorage(),
    ).execute({ artisanId: 'artisan-1', productId: 'product-1' })

    expect(!result.ok && result.error.code).toBe('product.not_found')
  })
})
