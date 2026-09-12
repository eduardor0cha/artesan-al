import type { Artisan, ArtisanId } from '@/domain/artisan/artisan'
import { PhoneNumber } from '@/domain/artisan/phone'
import { domainError, err, ok, type Result } from '@/domain/shared/result'

import type { ArtisanRepository } from '../ports/artisan.repository'

const MAX_CRAFT_LENGTH = 80
const MAX_CITY_LENGTH = 80
const MAX_STORY_LENGTH = 2000
const MAX_SICAB_LENGTH = 40

export const ARTISAN_PROFILE_NOT_FOUND = 'artisan.profile_not_found'

export type UpdateArtisanProfileInput = {
  artisanId: ArtisanId
  /** The only required field: with no number there is no way for a visitor to reach them. */
  publicPhone: string
  craft?: string
  city?: string
  story?: string
  sicabNumber?: string
}

/**
 * The artisan writing their own page. Everything here is what a visitor reads, which is why the
 * name and the slug are not part of it: the address of a profile gets pasted into conversations
 * and printed on a card, and it cannot change under whoever kept the link.
 *
 * The public number is separate from the one Better Auth holds for recovery. Sign-up fills both
 * with the same number, and this is where an artisan who sells on a shop line splits them.
 */
export class UpdateArtisanProfile {
  constructor(private readonly artisans: ArtisanRepository) {}

  async execute(input: UpdateArtisanProfileInput): Promise<Result<Artisan>> {
    const artisan = await this.artisans.findById(input.artisanId)

    if (!artisan) {
      return err(domainError(ARTISAN_PROFILE_NOT_FOUND, 'Não encontramos o seu perfil.'))
    }

    const phone = PhoneNumber.create(input.publicPhone)
    if (!phone.ok) return phone

    const craft = oneLine(input.craft, MAX_CRAFT_LENGTH)
    if (!craft.ok) return craft

    const city = oneLine(input.city, MAX_CITY_LENGTH)
    if (!city.ok) return city

    // Only trimmed: the story is written in a textarea, and the paragraphs are the artisan's.
    const story = text(input.story, MAX_STORY_LENGTH)
    if (!story.ok) return story

    // Self-declared and never checked against the national register, so it is stored as typed
    // beyond the length (ADR 0012).
    const sicabNumber = oneLine(input.sicabNumber, MAX_SICAB_LENGTH)
    if (!sicabNumber.ok) return sicabNumber

    const updated: Artisan = {
      ...artisan,
      publicPhone: phone.value.digits,
      craft: craft.value,
      city: city.value,
      story: story.value,
      sicabNumber: sicabNumber.value,
    }

    await this.artisans.save(updated)

    return ok(updated)
  }
}

/** An untouched optional field arrives as an empty string; the column means "not informed". */
function text(value: string | undefined, maxLength: number): Result<string | null> {
  const trimmed = value?.trim() ?? ''

  if (trimmed.length > maxLength) {
    return err(domainError('artisan.field_too_long', 'Esse texto está comprido demais.'))
  }

  return ok(trimmed === '' ? null : trimmed)
}

/** The same, for a field that is a label rather than prose: a stray line break is a slip. */
function oneLine(value: string | undefined, maxLength: number): Result<string | null> {
  return text(value?.replace(/\s+/g, ' '), maxLength)
}
