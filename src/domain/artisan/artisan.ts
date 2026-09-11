import type { Cpf } from './cpf'

export type ArtisanId = string

/**
 * Artisans create their own accounts (there is no institutional curation). Moderation is reactive:
 * a profile is visible as soon as it is created and is reviewed only when reported.
 */
export type Artisan = {
  readonly id: ArtisanId
  readonly cpf: Cpf
  readonly name: string
  /** Public contact channel and the account recovery channel (OTP). Required. */
  readonly phone: string
  /** Optional alternative contact; many artisans have no active email address. */
  readonly email: string | null
  readonly story: string | null
  readonly craft: string | null
  readonly createdAt: Date
}
