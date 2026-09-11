import { describe, expect, it } from 'vitest'

import { Coordinates } from './coordinates'

describe('Coordinates', () => {
  it('accepts a point in Alagoas', () => {
    const result = Coordinates.create(-9.7519, -36.6614)

    expect(result.ok).toBe(true)
  })

  it.each([
    ['latitude', 91, 0, 'coordinates.invalid_latitude'],
    ['longitude', 0, 181, 'coordinates.invalid_longitude'],
  ])('rejects an out-of-range %s', (_label, latitude, longitude, code) => {
    const result = Coordinates.create(latitude, longitude)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe(code)
    }
  })

  it('rejects NaN, which is what a malformed query parameter becomes', () => {
    const result = Coordinates.create(Number.NaN, -36.66)

    expect(result.ok).toBe(false)
  })
})
