import { describe, expect, it } from 'vitest'

import { FakeArtisanRepository, FakeSalesPointRepository } from '../testing/fake-repositories'
import { anArtisan, aSalesPoint } from '../testing/fixtures'
import { SALES_POINT_NOT_FOUND, ViewSalesPoint } from './view-sales-point'

describe('ViewSalesPoint', () => {
  const fair = aSalesPoint({ id: 'fair-1' })
  const maria = anArtisan({ id: 'artisan-1', name: 'Maria do Barro', slug: 'maria-do-barro' })
  const cicero = anArtisan({ id: 'artisan-2', name: 'Seu Cícero', slug: 'seu-cicero' })

  function useCase() {
    return new ViewSalesPoint(
      new FakeSalesPointRepository([fair]),
      new FakeArtisanRepository([maria, cicero], { 'fair-1': [maria, cicero] }),
    )
  }

  it('returns the point with everyone selling there', async () => {
    const result = await useCase().execute('fair-1')

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.salesPoint.name).toBe('Feira do Artesanato de Arapiraca')
    expect(result.value.artisans.map((artisan) => artisan.name)).toEqual([
      'Maria do Barro',
      'Seu Cícero',
    ])
  })

  it('fails with a not found error for an unknown point', async () => {
    const result = await useCase().execute('nao-existe')

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.error.code).toBe(SALES_POINT_NOT_FOUND)
  })

  it('still returns the point when nobody sells there yet', async () => {
    const empty = new ViewSalesPoint(
      new FakeSalesPointRepository([fair]),
      new FakeArtisanRepository([], {}),
    )

    const result = await empty.execute('fair-1')

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.artisans).toEqual([])
  })
})
