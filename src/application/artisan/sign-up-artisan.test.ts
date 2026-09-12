import { describe, expect, it } from 'vitest'

import { FakeArtisanAccountGateway, FakeArtisanRepository } from '../testing/fake-repositories'
import { anArtisan } from '../testing/fixtures'
import { CPF_ALREADY_REGISTERED, SignUpArtisan } from './sign-up-artisan'

/** Valid check digits; the sign-up refuses anything else before touching a store. */
const VALID_CPF = '529.982.247-25'
const OTHER_VALID_CPF = '168.995.350-09'

const validInput = {
  cpf: VALID_CPF,
  name: 'Maria do Barro',
  phone: '(82) 99912-0001',
  password: 'senha-forte-1',
}

describe('SignUpArtisan', () => {
  it('creates the account and the profile the visitor will read', async () => {
    const artisans = new FakeArtisanRepository()
    const accounts = new FakeArtisanAccountGateway()

    const result = await new SignUpArtisan(artisans, accounts).execute(validInput)

    if (!result.ok) throw new Error(`Cadastro válido recusado: ${result.error.message}`)

    expect(result.value.name).toBe('Maria do Barro')
    expect(result.value.slug).toBe('maria-do-barro')
    expect(result.value.publicPhone).toBe('82999120001')
    expect(await artisans.findBySlug('maria-do-barro')).not.toBeNull()
  })

  /** The document is the login identifier and lives only on the account side (ADR 0005). */
  it('hands the CPF to the account, never to the profile', async () => {
    const artisans = new FakeArtisanRepository()
    const accounts = new FakeArtisanAccountGateway()

    const result = await new SignUpArtisan(artisans, accounts).execute(validInput)

    expect(accounts.registrations[0]?.cpf.digits).toBe('52998224725')
    expect(JSON.stringify(result)).not.toContain('52998224725')
  })

  it('refuses a CPF that already has an account', async () => {
    const artisans = new FakeArtisanRepository([anArtisan()], {}, { 'artisan-1': '52998224725' })
    const accounts = new FakeArtisanAccountGateway()

    const result = await new SignUpArtisan(artisans, accounts).execute(validInput)

    expect(!result.ok && result.error.code).toBe(CPF_ALREADY_REGISTERED)
    expect(accounts.registrations).toHaveLength(0)
  })

  it('numbers the address of a second artisan with the same name', async () => {
    const artisans = new FakeArtisanRepository([anArtisan({ slug: 'maria-do-barro' })])
    const accounts = new FakeArtisanAccountGateway()

    const result = await new SignUpArtisan(artisans, accounts).execute({
      ...validInput,
      cpf: OTHER_VALID_CPF,
    })

    expect(result.ok && result.value.slug).toBe('maria-do-barro-2')
  })

  it('rejects an invalid CPF before creating anything', async () => {
    const artisans = new FakeArtisanRepository()
    const accounts = new FakeArtisanAccountGateway()

    const result = await new SignUpArtisan(artisans, accounts).execute({
      ...validInput,
      cpf: '111.111.111-11',
    })

    expect(!result.ok && result.error.code).toBe('cpf.repeated_digits')
    expect(accounts.registrations).toHaveLength(0)
  })

  it('rejects a number that is not a mobile, since it receives no recovery code', async () => {
    const result = await new SignUpArtisan(
      new FakeArtisanRepository(),
      new FakeArtisanAccountGateway(),
    ).execute({ ...validInput, phone: '82 83315-1000' })

    expect(!result.ok && result.error.code).toBe('phone.not_a_mobile')
  })

  it('rejects a password shorter than the provider accepts', async () => {
    const result = await new SignUpArtisan(
      new FakeArtisanRepository(),
      new FakeArtisanAccountGateway(),
    ).execute({ ...validInput, password: 'curta' })

    expect(!result.ok && result.error.code).toBe('artisan.password_too_short')
  })

  it('leaves no profile behind when the account cannot be created', async () => {
    const artisans = new FakeArtisanRepository()
    const accounts = new FakeArtisanAccountGateway('Número de celular já cadastrado.')

    const result = await new SignUpArtisan(artisans, accounts).execute(validInput)

    expect(result.ok).toBe(false)
    expect(await artisans.findBySlug('maria-do-barro')).toBeNull()
  })
})
