export type ArtisanId = string

/**
 * Artisans create their own accounts (there is no institutional curation). Moderation is reactive:
 * a profile is visible as soon as it is created and is reviewed only when reported.
 *
 * This is the profile the public pages read, so no credential belongs here: the CPF is the login
 * identifier inside Better Auth and, under the LGPD, must never reach a page, a URL or a log.
 */
export type Artisan = {
  readonly id: ArtisanId
  /** The Better Auth account that owns this profile. */
  readonly userId: string
  readonly name: string
  /** Public URL segment, e.g. /artesaos/maria-do-barro. Unique. */
  readonly slug: string
  /** Contact shown to visitors. May differ from the recovery number Better Auth holds. */
  readonly publicPhone: string
  readonly story: string | null
  readonly craft: string | null
  readonly city: string | null
  /**
   * Artisan register, optional and self-declared. Shown as plain information: nothing in the
   * system checks it against the national register, so there is no verified badge (ADR 0012).
   */
  readonly sicabNumber: string | null
  readonly createdAt: Date
}
