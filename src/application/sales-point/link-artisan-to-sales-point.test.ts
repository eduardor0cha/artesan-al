import { describe, expect, it } from 'vitest'

import {
  FakeArtisanSalesPointLinkRepository,
  FakeSalesPointRepository,
} from '../testing/fake-repositories'
import { aSalesPoint } from '../testing/fixtures'
import { LinkArtisanToSalesPoint } from './link-artisan-to-sales-point'
import { SALES_POINT_NOT_FOUND } from './view-sales-point'

describe('LinkArtisanToSalesPoint', () => {
  it('puts the artisan selling at a fair someone else registered', async () => {
    const fair = aSalesPoint()
    const links = new FakeArtisanSalesPointLinkRepository()

    const result = await new LinkArtisanToSalesPoint(
      new FakeSalesPointRepository([fair]),
      links,
    ).execute({ artisanId: 'artisan-2', salesPointId: fair.id })

    expect(result.ok && result.value.name).toBe(fair.name)
    expect(links.has('artisan-2', fair.id)).toBe(true)
  })

  /** Tapping twice on a slow connection is the common case, not an edge case. */
  it('leaves one current link when asked twice', async () => {
    const fair = aSalesPoint()
    const links = new FakeArtisanSalesPointLinkRepository()
    const useCase = new LinkArtisanToSalesPoint(new FakeSalesPointRepository([fair]), links)

    await useCase.execute({ artisanId: 'artisan-2', salesPointId: fair.id })
    await useCase.execute({ artisanId: 'artisan-2', salesPointId: fair.id })

    expect(links.links.size).toBe(1)
  })

  it('reports a point that is no longer there instead of writing a dangling link', async () => {
    const links = new FakeArtisanSalesPointLinkRepository()

    const result = await new LinkArtisanToSalesPoint(new FakeSalesPointRepository(), links).execute(
      { artisanId: 'artisan-2', salesPointId: 'sales-point-removed' },
    )

    expect(!result.ok && result.error.code).toBe(SALES_POINT_NOT_FOUND)
    expect(links.links.size).toBe(0)
  })
})
