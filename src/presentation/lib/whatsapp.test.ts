import { describe, expect, it } from 'vitest'

import { buildWhatsAppHref } from './whatsapp'

describe('buildWhatsAppHref', () => {
  it('adds the country code to a number typed the way artisans say it', () => {
    expect(buildWhatsAppHref('82999120001', 'Olá')).toContain('https://wa.me/5582999120001')
  })

  it('drops punctuation from a number typed with it', () => {
    expect(buildWhatsAppHref('(82) 99912-0001', 'Olá')).toContain('https://wa.me/5582999120001')
  })

  it('leaves a number that already carries the country code alone', () => {
    expect(buildWhatsAppHref('5582999120001', 'Olá')).toContain('https://wa.me/5582999120001')
  })

  it('escapes the message so accents and quotes survive the URL', () => {
    const href = buildWhatsAppHref('82999120001', 'Vi a peça "Moringa" e queria saber mais.')

    expect(href).toContain('text=Vi%20a%20pe%C3%A7a%20%22Moringa%22')
  })
})
