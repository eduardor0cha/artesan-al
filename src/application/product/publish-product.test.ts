import { describe, expect, it } from 'vitest'

import { FakeImageStorage, FakeProductRepository } from '../testing/fake-repositories'
import { PublishProduct } from './publish-product'

const aPhoto = (
  overrides: Partial<{ contentType: string; alt: string; bytes: Uint8Array }> = {},
) => ({
  bytes: new Uint8Array([1, 2, 3, 4]),
  contentType: 'image/jpeg',
  alt: 'Moringa de barro sobre uma mesa de madeira',
  ...overrides,
})

const validInput = {
  artisanId: 'artisan-1',
  name: 'Moringa de barro',
  description: 'Peça torneada à mão.',
  priceCents: 8500,
}

describe('PublishProduct', () => {
  it('publishes the piece with its photo', async () => {
    const products = new FakeProductRepository()
    const images = new FakeImageStorage()

    const result = await new PublishProduct(products, images).execute({
      ...validInput,
      photo: aPhoto(),
    })

    if (!result.ok) throw new Error(`Publicação válida recusada: ${result.error.message}`)

    expect(result.value.name).toBe('Moringa de barro')
    expect(result.value.price?.cents).toBe(8500)
    expect(result.value.images).toHaveLength(1)
    expect(result.value.images[0]!.alt).toBe('Moringa de barro sobre uma mesa de madeira')
    expect(await products.findById(result.value.id)).not.toBeNull()
  })

  /** A row pointing at bytes that were never uploaded would show the visitor a broken image. */
  it('sends the photo to the store before writing the piece', async () => {
    const images = new FakeImageStorage()

    const result = await new PublishProduct(new FakeProductRepository(), images).execute({
      ...validInput,
      photo: aPhoto(),
    })

    expect(images.uploaded).toHaveLength(1)
    expect(images.uploaded[0]!.contentType).toBe('image/jpeg')
    expect(result.ok && result.value.images[0]!.storageKey).toBe(images.uploaded[0]!.key)
  })

  it('accepts a piece with no photo and no price', async () => {
    const result = await new PublishProduct(
      new FakeProductRepository(),
      new FakeImageStorage(),
    ).execute({ artisanId: 'artisan-1', name: 'Cesto redondo' })

    expect(result.ok && result.value.images).toEqual([])
    expect(result.ok && result.value.price).toBeNull()
  })

  it('refuses a piece with no name anyone could recognise', async () => {
    const products = new FakeProductRepository()

    const result = await new PublishProduct(products, new FakeImageStorage()).execute({
      ...validInput,
      name: ' ',
    })

    expect(!result.ok && result.error.code).toBe('product.invalid_name')
    expect(products.products).toHaveLength(0)
  })

  /** The schema requires it and the axe run asserts it: a photo with no description never lands. */
  it('refuses a photo with no alternative text', async () => {
    const images = new FakeImageStorage()

    const result = await new PublishProduct(new FakeProductRepository(), images).execute({
      ...validInput,
      photo: aPhoto({ alt: '  ' }),
    })

    expect(!result.ok && result.error.code).toBe('product.invalid_alt')
    expect(images.uploaded).toHaveLength(0)
  })

  it('refuses a file that is not an image the browsers here can show', async () => {
    const result = await new PublishProduct(
      new FakeProductRepository(),
      new FakeImageStorage(),
    ).execute({ ...validInput, photo: aPhoto({ contentType: 'application/pdf' }) })

    expect(!result.ok && result.error.code).toBe('product.unsupported_photo')
  })

  it('refuses a photo the browser failed to reduce', async () => {
    const result = await new PublishProduct(
      new FakeProductRepository(),
      new FakeImageStorage(),
    ).execute({ ...validInput, photo: aPhoto({ bytes: new Uint8Array(3_000_000) }) })

    expect(!result.ok && result.error.code).toBe('product.photo_too_large')
  })

  it('refuses a price that is not a whole number of cents', async () => {
    const result = await new PublishProduct(
      new FakeProductRepository(),
      new FakeImageStorage(),
    ).execute({ ...validInput, priceCents: 85.5 })

    expect(!result.ok && result.error.code).toBe('price.not_an_integer')
  })
})
