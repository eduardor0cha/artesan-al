import { describe, expect, it } from 'vitest'

import { Price } from '@/domain/product/price'

import { FakeImageStorage, FakeProductRepository } from '../testing/fake-repositories'
import { aProduct, aProductImage } from '../testing/fixtures'
import { PRODUCT_NOT_YOURS } from './artisan-product'
import { UpdateProduct } from './update-product'

const price = Price.create(8500)
if (!price.ok) throw new Error('Preço inválido na fixture.')

const moringa = aProduct({
  id: 'product-1',
  artisanId: 'artisan-1',
  price: price.value,
  images: [aProductImage({ storageKey: 'produtos/antiga.jpg' })],
})

const validInput = {
  artisanId: 'artisan-1',
  productId: 'product-1',
  name: 'Moringa de barro grande',
  description: 'Peça torneada à mão.',
  priceCents: 9000,
}

describe('UpdateProduct', () => {
  it('saves the new name, description and price', async () => {
    const products = new FakeProductRepository([moringa])

    const result = await new UpdateProduct(products, new FakeImageStorage()).execute(validInput)

    if (!result.ok) throw new Error(`Edição válida recusada: ${result.error.message}`)

    expect(result.value.name).toBe('Moringa de barro grande')
    expect(result.value.price?.cents).toBe(9000)
    expect(products.products).toHaveLength(1)
  })

  it('keeps the photo already stored when no new file was chosen', async () => {
    const images = new FakeImageStorage()

    const result = await new UpdateProduct(new FakeProductRepository([moringa]), images).execute(
      validInput,
    )

    expect(result.ok && result.value.images[0]!.storageKey).toBe('produtos/antiga.jpg')
    expect(images.uploaded).toHaveLength(0)
    expect(images.deleted).toEqual([])
  })

  /** A wording gets fixed far more often than a photo gets taken again. */
  it('rewrites the description of the photo without uploading anything', async () => {
    const images = new FakeImageStorage()

    const result = await new UpdateProduct(new FakeProductRepository([moringa]), images).execute({
      ...validInput,
      alt: 'Moringa de barro com alça, sobre uma mesa',
    })

    expect(result.ok && result.value.images[0]!.alt).toBe(
      'Moringa de barro com alça, sobre uma mesa',
    )
    expect(result.ok && result.value.images[0]!.storageKey).toBe('produtos/antiga.jpg')
    expect(images.uploaded).toHaveLength(0)
  })

  it('replaces the photo and only then forgets the old file', async () => {
    const products = new FakeProductRepository([moringa])
    const images = new FakeImageStorage()

    const result = await new UpdateProduct(products, images).execute({
      ...validInput,
      photo: {
        bytes: new Uint8Array([9, 9, 9]),
        contentType: 'image/webp',
        alt: 'Moringa de barro vista de cima',
      },
    })

    const stored = images.uploaded[0]!.key

    expect(result.ok && result.value.images[0]!.storageKey).toBe(stored)
    expect(stored).not.toBe('produtos/antiga.jpg')
    expect(images.deleted).toEqual(['produtos/antiga.jpg'])
    expect(products.products[0]!.images[0]!.storageKey).toBe(stored)
  })

  it('refuses to touch a piece made by someone else', async () => {
    const products = new FakeProductRepository([moringa])

    const result = await new UpdateProduct(products, new FakeImageStorage()).execute({
      ...validInput,
      artisanId: 'artisan-2',
    })

    expect(!result.ok && result.error.code).toBe(PRODUCT_NOT_YOURS)
    expect(products.products[0]!.name).toBe('Moringa de barro')
  })

  it('refuses to blank out the description of a photo that stays', async () => {
    const result = await new UpdateProduct(
      new FakeProductRepository([moringa]),
      new FakeImageStorage(),
    ).execute({ ...validInput, alt: '' })

    expect(!result.ok && result.error.code).toBe('product.invalid_alt')
  })

  it('reports a piece that no longer exists', async () => {
    const result = await new UpdateProduct(
      new FakeProductRepository(),
      new FakeImageStorage(),
    ).execute(validInput)

    expect(!result.ok && result.error.code).toBe('product.not_found')
  })
})
