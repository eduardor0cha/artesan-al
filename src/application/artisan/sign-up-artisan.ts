import type { Artisan } from '@/domain/artisan/artisan'
import { Cpf } from '@/domain/artisan/cpf'
import { PhoneNumber } from '@/domain/artisan/phone'
import { Slug } from '@/domain/artisan/slug'
import { domainError, err, ok, type Result } from '@/domain/shared/result'

import type { ArtisanAccountGateway } from '../ports/artisan-account.gateway'
import type { ArtisanRepository } from '../ports/artisan.repository'

export const CPF_ALREADY_REGISTERED = 'artisan.cpf_already_registered'

const MIN_NAME_LENGTH = 3

/** Better Auth's own floor. Saying it here lets the artisan read it before the request is sent. */
const MIN_PASSWORD_LENGTH = 8

/** Enough to get past a repeated name; past this the name is not what is wrong. */
const MAX_SLUG_ATTEMPTS = 50

export type SignUpArtisanInput = {
  cpf: string
  name: string
  phone: string
  password: string
}

/**
 * Creating an artisan is two writes in two stores: the credentials go to the auth provider, keyed
 * by CPF, and the profile the visitor reads goes to `artisans`. There is no curator to do this on
 * anyone's behalf (ADR 0004), so everything the account needs is asked for once, here.
 */
export class SignUpArtisan {
  constructor(
    private readonly artisans: ArtisanRepository,
    private readonly accounts: ArtisanAccountGateway,
  ) {}

  async execute(input: SignUpArtisanInput): Promise<Result<Artisan>> {
    const cpf = Cpf.create(input.cpf)
    if (!cpf.ok) return cpf

    const phone = PhoneNumber.create(input.phone)
    if (!phone.ok) return phone

    const name = input.name.trim().replace(/\s+/g, ' ')

    if (name.length < MIN_NAME_LENGTH) {
      return err(domainError('artisan.name_too_short', 'Escreva seu nome completo.'))
    }

    if (input.password.length < MIN_PASSWORD_LENGTH) {
      return err(
        domainError(
          'artisan.password_too_short',
          `A senha precisa de pelo menos ${MIN_PASSWORD_LENGTH} letras ou números.`,
        ),
      )
    }

    if (await this.artisans.findByCpf(cpf.value)) {
      return err(
        domainError(
          CPF_ALREADY_REGISTERED,
          'Este CPF já tem uma conta. Entre com sua senha ou peça um código para criar outra.',
        ),
      )
    }

    const slug = await this.freeSlug(name)
    if (!slug.ok) return slug

    // The account comes first: without it there is no owner for the profile, and a profile with
    // no account would be a page nobody can edit.
    const account = await this.accounts.register({
      cpf: cpf.value,
      name,
      phone: phone.value,
      password: input.password,
    })
    if (!account.ok) return account

    const artisan: Artisan = {
      id: crypto.randomUUID(),
      userId: account.value,
      name,
      slug: slug.value.value,
      // One number is asked for and serves both ends: recovery now, contact on the public page.
      // Slice 6 lets the artisan set a different public one.
      publicPhone: phone.value.digits,
      story: null,
      craft: null,
      city: null,
      sicabNumber: null,
      createdAt: new Date(),
    }

    await this.artisans.save(artisan)

    return ok(artisan)
  }

  /**
   * Two artisans really can share a name, so the slug is numbered until it is free. Two sign-ups
   * racing for the same name still collide on the unique index, and the second one fails loudly
   * rather than stealing the first one's address.
   */
  private async freeSlug(name: string): Promise<Result<Slug>> {
    const base = Slug.fromName(name)
    if (!base.ok) return base

    for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt += 1) {
      const candidate = attempt === 1 ? base.value : base.value.withSuffix(attempt)

      if (!(await this.artisans.findBySlug(candidate.value))) return ok(candidate)
    }

    return err(
      domainError('artisan.slug_unavailable', 'Não conseguimos criar sua página. Tente de novo.'),
    )
  }
}
