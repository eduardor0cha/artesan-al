import { describe, expect, it } from 'vitest'

import { SearchRadius } from './search-radius'

describe('SearchRadius', () => {
  it('converts kilometres to the metres PostGIS expects', () => {
    const result = SearchRadius.create(2.5)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.meters).toBe(2500)
    }
  })

  it('refuses a radius wide enough to make the spatial index useless', () => {
    const result = SearchRadius.create(5000)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('search_radius.out_of_range')
    }
  })

  it('refuses a non-numeric radius coming from a query string', () => {
    const result = SearchRadius.create(Number('perto'))

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('search_radius.not_a_number')
    }
  })
})
