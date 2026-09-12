import { describe, expect, it } from 'vitest'

import {
  FakeArtisanSalesPointLinkRepository,
  FakeSalesPointRepository,
} from '../testing/fake-repositories'
import { RegisterSalesPoint } from './register-sales-point'

const validInput = {
  artisanId: 'artisan-1',
  name: 'Feira do Artesanato de Arapiraca',
  type: 'fair',
  latitude: -9.7519,
  longitude: -36.6614,
  address: 'Centro, Arapiraca',
  openingHours: 'Sábados, das 6h às 12h',
}

describe('RegisterSalesPoint', () => {
  it('registers the point and puts the artisan selling there', async () => {
    const salesPoints = new FakeSalesPointRepository()
    const links = new FakeArtisanSalesPointLinkRepository()

    const result = await new RegisterSalesPoint(salesPoints, links).execute(validInput)

    if (!result.ok) throw new Error(`Cadastro válido recusado: ${result.error.message}`)

    expect(result.value.name).toBe('Feira do Artesanato de Arapiraca')
    expect(result.value.createdBy).toBe('artisan-1')
    expect(await salesPoints.findById(result.value.id)).not.toBeNull()
    expect(links.has('artisan-1', result.value.id)).toBe(true)
  })

  it('stores an untouched optional field as "not informed"', async () => {
    const result = await new RegisterSalesPoint(
      new FakeSalesPointRepository(),
      new FakeArtisanSalesPointLinkRepository(),
    ).execute({ ...validInput, address: '', openingHours: '   ' })

    expect(result.ok && result.value.address).toBeNull()
    expect(result.ok && result.value.openingHours).toBeNull()
  })

  it('refuses a point with no name anyone could recognise', async () => {
    const salesPoints = new FakeSalesPointRepository()
    const links = new FakeArtisanSalesPointLinkRepository()

    const result = await new RegisterSalesPoint(salesPoints, links).execute({
      ...validInput,
      name: ' a ',
    })

    expect(!result.ok && result.error.code).toBe('sales_point.invalid_name')
    expect(links.links.size).toBe(0)
  })

  /** The type arrives from a select and decides how the point is shown and reused. */
  it('refuses a type that is not one of the four', async () => {
    const result = await new RegisterSalesPoint(
      new FakeSalesPointRepository(),
      new FakeArtisanSalesPointLinkRepository(),
    ).execute({ ...validInput, type: 'barraca' })

    expect(!result.ok && result.error.code).toBe('sales_point.invalid_type')
  })

  it('refuses coordinates the map could not have produced', async () => {
    const result = await new RegisterSalesPoint(
      new FakeSalesPointRepository(),
      new FakeArtisanSalesPointLinkRepository(),
    ).execute({ ...validInput, longitude: 999 })

    expect(!result.ok && result.error.code).toBe('coordinates.invalid_longitude')
  })
})
