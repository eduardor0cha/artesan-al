import { describe, expect, it } from 'vitest'

import {
  FakeArtisanRepository,
  FakeImageStorage,
  FakeProductRepository,
  FakeSalesPointRepository,
} from '../testing/fake-repositories'
import { anArtisan, aProduct, aProductImage, aSalesPoint } from '../testing/fixtures'
import { PRODUCT_NOT_FOUND } from './artisan-product'
import { ViewProduct } from './view-product'

describe('ViewProduct', () => {
  const maria = anArtisan({ id: 'artisan-1' })
  const fair = aSalesPoint({ id: 'fair-1' })

  const moringa = aProduct({
    id: 'product-1',
    artisanId: 'artisan-1',
    images: [
      aProductImage({ id: 'image-2', storageKey: 'produtos/lado.jpg', position: 1 }),
      aProductImage({ id: 'image-1', storageKey: 'produtos/frente.jpg', position: 0 }),
    ],
  })

  function useCase(products = [moringa], artisans = [maria]) {
    return new ViewProduct(
      new FakeProductRepository(products),
      new FakeArtisanRepository(artisans),
      new FakeSalesPointRepository([fair], { 'artisan-1': [fair] }),
      new FakeImageStorage(),
    )
  }

  it('returns the piece with who made it and where to buy it', async () => {
    const result = await useCase().execute('product-1')

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.product.name).toBe('Moringa de barro')
    expect(result.value.artisan.slug).toBe('maria-do-barro')
    expect(result.value.salesPoints.map((point) => point.id)).toEqual(['fair-1'])
  })

  it('shows the first photo by position, whatever order the repository returned', async () => {
    const result = await useCase().execute('product-1')

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.photo?.url).toBe('https://fotos.exemplo/artesanal/produtos/frente.jpg')
  })

  it('fails with a not found error for an unknown piece', async () => {
    const result = await useCase().execute('nao-existe')

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.error.code).toBe(PRODUCT_NOT_FOUND)
  })

  it('refuses to show a piece whose artisan is missing, instead of one without a maker', async () => {
    const result = await useCase([moringa], []).execute('product-1')

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.error.code).toBe(PRODUCT_NOT_FOUND)
  })
})
