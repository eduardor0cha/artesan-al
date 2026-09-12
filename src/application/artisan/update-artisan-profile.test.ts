import { describe, expect, it } from 'vitest'

import { FakeArtisanRepository } from '../testing/fake-repositories'
import { anArtisan } from '../testing/fixtures'
import { ARTISAN_PROFILE_NOT_FOUND, UpdateArtisanProfile } from './update-artisan-profile'

const maria = anArtisan({ id: 'artisan-1', slug: 'maria-do-barro' })

const validInput = {
  artisanId: 'artisan-1',
  publicPhone: '(82) 98888-7777',
  craft: 'Cerâmica utilitária',
  city: 'Arapiraca',
  story: 'Trabalha com barro do Agreste há trinta anos.',
  sicabNumber: 'AL-2018-0413',
}

const profileOf = (repository: FakeArtisanRepository) => repository.findById('artisan-1')

describe('UpdateArtisanProfile', () => {
  it('saves what the visitor reads on the page', async () => {
    const artisans = new FakeArtisanRepository([maria])

    const result = await new UpdateArtisanProfile(artisans).execute(validInput)

    if (!result.ok) throw new Error(`Edição válida recusada: ${result.error.message}`)

    expect(result.value.craft).toBe('Cerâmica utilitária')
    expect(result.value.city).toBe('Arapiraca')
    expect(result.value.sicabNumber).toBe('AL-2018-0413')
    expect((await profileOf(artisans))?.story).toBe('Trabalha com barro do Agreste há trinta anos.')
  })

  /** The number is typed with the punctuation people use; what is stored is the digits. */
  it('keeps only the digits of the public number', async () => {
    const result = await new UpdateArtisanProfile(new FakeArtisanRepository([maria])).execute(
      validInput,
    )

    expect(result.ok && result.value.publicPhone).toBe('82988887777')
  })

  /**
   * The address of a profile is pasted into conversations and printed on cards, so nothing here
   * may move it — not even a change of name.
   */
  it('never moves the page: the name and the address stay as they were', async () => {
    const result = await new UpdateArtisanProfile(new FakeArtisanRepository([maria])).execute(
      validInput,
    )

    expect(result.ok && result.value.slug).toBe('maria-do-barro')
    expect(result.ok && result.value.name).toBe(maria.name)
  })

  it('stores an untouched optional field as "not informed"', async () => {
    const result = await new UpdateArtisanProfile(new FakeArtisanRepository([maria])).execute({
      artisanId: 'artisan-1',
      publicPhone: '82988887777',
      craft: '  ',
      city: '',
      story: '',
      sicabNumber: '',
    })

    expect(result.ok && result.value.craft).toBeNull()
    expect(result.ok && result.value.city).toBeNull()
    expect(result.ok && result.value.story).toBeNull()
    expect(result.ok && result.value.sicabNumber).toBeNull()
  })

  it('keeps the paragraphs of the story as they were written', async () => {
    const story = 'Aprendi com minha mãe.\n\nHoje ensino minhas filhas.'

    const result = await new UpdateArtisanProfile(new FakeArtisanRepository([maria])).execute({
      ...validInput,
      story,
    })

    expect(result.ok && result.value.story).toBe(story)
  })

  it('refuses a number a client could not call on WhatsApp', async () => {
    const artisans = new FakeArtisanRepository([maria])

    const result = await new UpdateArtisanProfile(artisans).execute({
      ...validInput,
      // Eleven digits, but the third is not the 9 every Brazilian mobile gained in 2016.
      publicPhone: '82833334444',
    })

    expect(!result.ok && result.error.code).toBe('phone.not_a_mobile')
    expect((await profileOf(artisans))?.publicPhone).toBe(maria.publicPhone)
  })

  it('refuses a craft longer than a label', async () => {
    const result = await new UpdateArtisanProfile(new FakeArtisanRepository([maria])).execute({
      ...validInput,
      craft: 'cerâmica '.repeat(20),
    })

    expect(!result.ok && result.error.code).toBe('artisan.field_too_long')
  })

  it('reports a profile that is not there', async () => {
    const result = await new UpdateArtisanProfile(new FakeArtisanRepository()).execute(validInput)

    expect(!result.ok && result.error.code).toBe(ARTISAN_PROFILE_NOT_FOUND)
  })
})
