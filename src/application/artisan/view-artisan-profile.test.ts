import { describe, expect, it } from 'vitest'

import {
  FakeArtisanRepository,
  FakeImageStorage,
  FakeProductRepository,
  FakeSalesPointRepository,
} from '../testing/fake-repositories'
import { anArtisan, aProduct, aProductImage, aSalesPoint } from '../testing/fixtures'
import { ARTISAN_NOT_FOUND, ViewArtisanProfile } from './view-artisan-profile'

describe('ViewArtisanProfile', () => {
  const maria = anArtisan({ id: 'artisan-1', slug: 'maria-do-barro' })
  const fair = aSalesPoint({ id: 'fair-1' })

  const moringa = aProduct({
    id: 'product-1',
    name: 'Moringa de barro',
    images: [aProductImage({ storageKey: 'produtos/moringa.jpg', position: 0 })],
  })

  const alguidares = aProduct({ id: 'product-2', name: 'Jogo de alguidares' })

  function useCase() {
    return new ViewArtisanProfile(
      new FakeArtisanRepository([maria]),
      new FakeProductRepository([moringa, alguidares]),
      new FakeSalesPointRepository([fair], { 'artisan-1': [fair] }),
      new FakeImageStorage(),
    )
  }

  it('finds the artisan by the slug the public URL carries', async () => {
    const result = await useCase().execute('maria-do-barro')

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.artisan.name).toBe('Maria do Barro')
    expect(result.value.salesPoints.map((point) => point.name)).toEqual([
      'Feira do Artesanato de Arapiraca',
    ])
  })

  it('fails with a not found error for an unknown slug', async () => {
    const result = await useCase().execute('nao-existe')

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.error.code).toBe(ARTISAN_NOT_FOUND)
  })

  it('resolves each stored photo key into an address the browser can fetch', async () => {
    const result = await useCase().execute('maria-do-barro')

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.products[0]?.photo).toEqual({
      url: 'https://fotos.exemplo/artesanal/produtos/moringa.jpg',
      alt: 'Moringa de barro sobre uma mesa de madeira',
    })
  })

  it('leaves the photo null for a piece published without one', async () => {
    const result = await useCase().execute('maria-do-barro')

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.products[1]?.photo).toBeNull()
  })
})
