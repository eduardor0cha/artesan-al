import { describe, expect, it } from 'vitest'

import { Slug } from './slug'

describe('Slug', () => {
  it('turns a name into the segment that goes in the URL', () => {
    const result = Slug.fromName('Maria do Barro')

    expect(result.ok && result.value.value).toBe('maria-do-barro')
  })

  it('drops accents and cedillas instead of escaping them', () => {
    const result = Slug.fromName('Ateliê Açaí do Sertão')

    expect(result.ok && result.value.value).toBe('atelie-acai-do-sertao')
  })

  it('collapses punctuation and spacing into single hyphens', () => {
    const result = Slug.fromName('  Coletivo   Bordadeiras // do Sertão!  ')

    expect(result.ok && result.value.value).toBe('coletivo-bordadeiras-do-sertao')
  })

  it('refuses a name with no letters or digits to carry', () => {
    const result = Slug.fromName('*** ???')

    expect(!result.ok && result.error.code).toBe('slug.empty')
  })

  it('numbers the next candidate when the name is taken', () => {
    const result = Slug.fromName('Maria do Barro')

    if (!result.ok) throw new Error('Nome válido rejeitado no teste.')

    expect(result.value.withSuffix(2).value).toBe('maria-do-barro-2')
  })

  /** The column has a length the suffix must fit inside, and a trailing hyphen is not a slug. */
  it('keeps a suffixed long name within the limit and without a dangling hyphen', () => {
    const result = Slug.fromName('a'.repeat(58) + ' bc')

    if (!result.ok) throw new Error('Nome válido rejeitado no teste.')

    const suffixed = result.value.withSuffix(2).value

    expect(suffixed.length).toBeLessThanOrEqual(60)
    expect(Slug.create(suffixed).ok).toBe(true)
  })

  it('rejects a value that is not in slug shape', () => {
    expect(Slug.create('Maria do Barro').ok).toBe(false)
    expect(Slug.create('-maria').ok).toBe(false)
    expect(Slug.create('maria--do-barro').ok).toBe(false)
  })
})
