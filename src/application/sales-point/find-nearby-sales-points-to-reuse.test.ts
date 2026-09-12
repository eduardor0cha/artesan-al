import { describe, expect, it } from 'vitest'

import { Coordinates } from '@/domain/sales-point/coordinates'

import { FakeSalesPointRepository } from '../testing/fake-repositories'
import { aSalesPoint } from '../testing/fixtures'
import { FindNearbySalesPointsToReuse } from './find-nearby-sales-points-to-reuse'

/** The fair the seed puts in the centre of Arapiraca, and where the artisan is standing. */
const FAIR = { latitude: -9.7519, longitude: -36.6614 }

function at(latitude: number, longitude: number): Coordinates {
  const result = Coordinates.create(latitude, longitude)
  if (!result.ok) throw new Error('Coordenada inválida na fixture do teste.')
  return result.value
}

/** Roughly 55 m north of the fair: the same place, seen by a phone's GPS. */
const NEXT_TO_THE_FAIR = { latitude: -9.7514, longitude: -36.6614 }

/** Another town, well outside the short radius. */
const FAR_AWAY = aSalesPoint({ id: 'sales-point-far', coordinates: at(-9.6658, -35.7353) })

describe('FindNearbySalesPointsToReuse', () => {
  it('offers the fair already registered where the artisan is standing', async () => {
    const fair = aSalesPoint()
    const salesPoints = new FakeSalesPointRepository([fair, FAR_AWAY])

    const result = await new FindNearbySalesPointsToReuse(salesPoints).execute({
      artisanId: 'artisan-2',
      ...NEXT_TO_THE_FAIR,
    })

    if (!result.ok) throw new Error('Busca válida recusada no teste.')

    expect(result.value).toHaveLength(1)
    expect(result.value[0]?.salesPoint.id).toBe(fair.id)
    expect(result.value[0]?.distanceMeters).toBeLessThan(100)
    expect(result.value[0]?.alreadySelling).toBe(false)
  })

  it('marks the points where this artisan already sells', async () => {
    const fair = aSalesPoint()
    const salesPoints = new FakeSalesPointRepository([fair], { 'artisan-1': [fair] })

    const result = await new FindNearbySalesPointsToReuse(salesPoints).execute({
      artisanId: 'artisan-1',
      ...FAIR,
    })

    expect(result.ok && result.value[0]?.alreadySelling).toBe(true)
  })

  it('finds nothing where nothing is registered, which is how a new point starts', async () => {
    const salesPoints = new FakeSalesPointRepository([FAR_AWAY])

    const result = await new FindNearbySalesPointsToReuse(salesPoints).execute({
      artisanId: 'artisan-1',
      ...FAIR,
    })

    expect(result.ok && result.value).toEqual([])
  })

  it('refuses coordinates that could not come from a map or a GPS', async () => {
    const result = await new FindNearbySalesPointsToReuse(new FakeSalesPointRepository()).execute({
      artisanId: 'artisan-1',
      latitude: 120,
      longitude: -36.6614,
    })

    expect(!result.ok && result.error.code).toBe('coordinates.invalid_latitude')
  })
})
