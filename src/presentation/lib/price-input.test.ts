import { describe, expect, it } from 'vitest'

import { formatPriceInput, parsePriceInput } from './price-input'

describe('parsePriceInput', () => {
  it('reads a whole number of reais', () => {
    expect(parsePriceInput('85')).toBe(8500)
  })

  it('reads the comma as the cents separator', () => {
    expect(parsePriceInput('85,50')).toBe(8550)
  })

  it('reads what someone copied from another screen, sign and thousands included', () => {
    expect(parsePriceInput('R$ 1.200,00')).toBe(120_000)
  })

  /** Leaving the field empty is how a piece is priced by negotiation, which is common here. */
  it('reads a blank field as no price', () => {
    expect(parsePriceInput('   ')).toBeNull()
  })

  it('refuses what is not a price, instead of guessing a number out of it', () => {
    expect(parsePriceInput('a combinar')).toBeUndefined()
    expect(parsePriceInput('85,5,5')).toBeUndefined()
    expect(parsePriceInput('-85')).toBeUndefined()
  })

  /** Three decimals is a typo, not a price: it would silently become a different value. */
  it('refuses more decimals than a cent', () => {
    expect(parsePriceInput('85,505')).toBeUndefined()
  })
})

describe('formatPriceInput', () => {
  it('writes the stored cents the way they were typed', () => {
    expect(formatPriceInput(8550)).toBe('85,50')
  })

  it('leaves the field empty for a piece with no price', () => {
    expect(formatPriceInput(null)).toBe('')
  })
})
