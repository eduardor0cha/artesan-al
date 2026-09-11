import { describe, expect, it } from 'vitest'

import { Cpf } from './cpf'

describe('Cpf', () => {
  it('accepts a valid CPF and keeps only its digits', () => {
    const result = Cpf.create('529.982.247-25')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.digits).toBe('52998224725')
    }
  })

  it('rejects a CPF with the wrong number of digits', () => {
    const result = Cpf.create('5299822472')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('cpf.invalid_length')
    }
  })

  it('rejects repeated digits, which pass the check-digit maths but are not real documents', () => {
    const result = Cpf.create('111.111.111-11')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('cpf.repeated_digits')
    }
  })

  it('rejects a CPF whose check digits do not match', () => {
    const result = Cpf.create('529.982.247-24')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('cpf.invalid_check_digits')
    }
  })

  it('masks the document so it can be shown back to its owner without exposing it', () => {
    const result = Cpf.create('52998224725')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.masked).toBe('***.982.247-**')
    }
  })
})
