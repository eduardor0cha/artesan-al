import { describe, expect, it } from 'vitest'

import { Coordinates } from '@/domain/sales-point/coordinates'
import type { SalesPoint } from '@/domain/sales-point/sales-point'

import type {
  NearbySalesPointSearch,
  NearbySalesPointSummary,
  SalesPointSearchQuery,
} from '../ports/sales-point-search.query'
import {
  DEFAULT_SEARCH_CENTER,
  MAX_SEARCH_RESULTS,
  SearchNearbySalesPoints,
} from './search-nearby-sales-points'

/** Coordinates are known-good here, so a failure means the test itself is wrong. */
function at(latitude: number, longitude: number): Coordinates {
  const result = Coordinates.create(latitude, longitude)
  if (!result.ok) throw new Error(`Coordenada inválida no teste: ${result.error.message}`)
  return result.value
}

class FakeSalesPointSearchQuery implements SalesPointSearchQuery {
  lastSearch: NearbySalesPointSearch | null = null

  constructor(private readonly results: NearbySalesPointSummary[] = []) {}

  findNearby(search: NearbySalesPointSearch): Promise<NearbySalesPointSummary[]> {
    this.lastSearch = search
    return Promise.resolve(this.results)
  }
}

function summaryOf(name: string, distanceMeters: number): NearbySalesPointSummary {
  const salesPoint: SalesPoint = {
    id: `id-${name}`,
    name,
    type: 'fair',
    coordinates: at(-9.7519, -36.6614),
    address: null,
    openingHours: null,
    createdBy: 'some-artisan',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  }

  return { salesPoint, distanceMeters, artisanNames: ['Maria do Barro'], artisanCount: 1 }
}

describe('SearchNearbySalesPoints', () => {
  it('searches around the coordinates the visitor gave, with the radius they chose', async () => {
    const query = new FakeSalesPointSearchQuery([summaryOf('Feira do Artesanato', 0)])
    const useCase = new SearchNearbySalesPoints(query)

    const result = await useCase.execute({
      latitude: -9.7519,
      longitude: -36.6614,
      radiusKilometers: 25,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.center.latitude).toBe(-9.7519)
    expect(result.value.center.longitude).toBe(-36.6614)
    expect(result.value.radius.kilometers).toBe(25)
    expect(result.value.salesPoints).toHaveLength(1)
    expect(query.lastSearch?.radius.meters).toBe(25_000)
  })

  it('falls back to Maceió when the visitor has not said where they are', async () => {
    const query = new FakeSalesPointSearchQuery()
    const useCase = new SearchNearbySalesPoints(query)

    const result = await useCase.execute({})

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.center.latitude).toBe(DEFAULT_SEARCH_CENTER.latitude)
    expect(result.value.center.longitude).toBe(DEFAULT_SEARCH_CENTER.longitude)
  })

  it('falls back to the default radius when none was chosen', async () => {
    const query = new FakeSalesPointSearchQuery()
    const useCase = new SearchNearbySalesPoints(query)

    const result = await useCase.execute({ latitude: -9.7519, longitude: -36.6614 })

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.value.radius.kilometers).toBe(10)
  })

  it('caps how many points one search may return', async () => {
    const query = new FakeSalesPointSearchQuery()
    const useCase = new SearchNearbySalesPoints(query)

    await useCase.execute({ latitude: -9.7519, longitude: -36.6614 })

    expect(query.lastSearch?.limit).toBe(MAX_SEARCH_RESULTS)
  })

  it('rejects a malformed coordinate without touching the database', async () => {
    const query = new FakeSalesPointSearchQuery()
    const useCase = new SearchNearbySalesPoints(query)

    const result = await useCase.execute({ latitude: Number('aqui'), longitude: -36.6614 })

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.error.code).toBe('coordinates.invalid_latitude')
    expect(query.lastSearch).toBeNull()
  })

  it('rejects a radius wider than the domain allows', async () => {
    const query = new FakeSalesPointSearchQuery()
    const useCase = new SearchNearbySalesPoints(query)

    const result = await useCase.execute({
      latitude: -9.7519,
      longitude: -36.6614,
      radiusKilometers: 5000,
    })

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.error.code).toBe('search_radius.out_of_range')
    expect(query.lastSearch).toBeNull()
  })
})
