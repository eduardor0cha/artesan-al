import { describe, expect, it } from 'vitest'

import { PhoneNumber } from './phone'

describe('PhoneNumber', () => {
  it('accepts a mobile written the way people say it', () => {
    const result = PhoneNumber.create('(82) 99912-0001')

    expect(result.ok && result.value.digits).toBe('82999120001')
  })

  it('accepts a number already carrying the country code', () => {
    const result = PhoneNumber.create('+55 82 99912-0001')

    expect(result.ok && result.value.digits).toBe('82999120001')
  })

  /** Area code 55 is Santa Maria (RS), so 55 at the front is not always Brazil. */
  it('keeps area code 55 when the number is already national', () => {
    const result = PhoneNumber.create('55999120001')

    expect(result.ok && result.value.digits).toBe('55999120001')
  })

  it('rejects a number without the area code', () => {
    const result = PhoneNumber.create('999120001')

    expect(!result.ok && result.error.code).toBe('phone.invalid_length')
  })

  it('rejects an area code that does not exist', () => {
    const result = PhoneNumber.create('09999120001')

    expect(!result.ok && result.error.code).toBe('phone.invalid_area_code')
  })

  /** A landline receives neither the recovery code nor a WhatsApp message. */
  it('rejects a landline', () => {
    const result = PhoneNumber.create('8233151000')

    expect(result.ok).toBe(false)
  })

  it('formats for reading and for sending', () => {
    const result = PhoneNumber.create('82999120001')

    if (!result.ok) throw new Error('Número válido rejeitado no teste.')

    expect(result.value.formatted).toBe('(82) 99912-0001')
    expect(result.value.international).toBe('5582999120001')
  })

  it('compares by digits, not by how it was typed', () => {
    const one = PhoneNumber.create('82 99912-0001')
    const other = PhoneNumber.create('+5582999120001')

    expect(one.ok && other.ok && one.value.equals(other.value)).toBe(true)
  })
})
