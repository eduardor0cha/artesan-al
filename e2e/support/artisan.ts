import { expect, type Page } from '@playwright/test'

/**
 * Sign-up is the only way into the panel, and every account it creates is permanent: the CPF, the
 * phone and the public address are all unique. So each test invents its own artisan instead of
 * sharing one, which also keeps the two Playwright devices from colliding.
 */
export type NewArtisan = {
  name: string
  cpf: string
  phone: string
  password: string
}

export function anArtisanToSignUp(): NewArtisan {
  const suffix = Math.random().toString(36).slice(2, 8)

  return {
    name: `Artesã de Teste ${suffix}`,
    cpf: generateCpf(),
    phone: generateMobile(),
    password: 'senha-de-teste-1',
  }
}

export async function signUp(page: Page, artisan: NewArtisan): Promise<void> {
  await page.goto('/criar-conta')

  await page.getByLabel('Seu nome').fill(artisan.name)
  await page.getByLabel('CPF').fill(artisan.cpf)
  await page.getByLabel('Celular com DDD').fill(artisan.phone)
  await page.getByLabel('Senha').fill(artisan.password)

  await page.getByRole('button', { name: 'Criar minha conta' }).click()
  await expect(page).toHaveURL(/\/painel\/onde-vendo\/novo/)
}

export async function signIn(page: Page, artisan: NewArtisan): Promise<void> {
  await page.goto('/entrar')

  await page.getByLabel('CPF').fill(artisan.cpf)
  await page.getByLabel('Senha').fill(artisan.password)

  await page.getByRole('button', { name: 'Entrar' }).click()
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Sair da conta' }).click()
  await expect(page).toHaveURL(/\/entrar/)
}

/** A document with valid check digits, which is all the sign-up checks. */
function generateCpf(): string {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))

  // The second digit is computed over the first nine plus the first check digit, so they cannot
  // be pushed in one call.
  digits.push(checkDigit(digits, 9))
  digits.push(checkDigit(digits, 10))

  const value = digits.join('')

  // Repeated digits pass the check-digit maths and are refused on purpose; start over.
  return /^(\d)\1{10}$/.test(value) ? generateCpf() : value
}

function checkDigit(digits: number[], upTo: number): number {
  let sum = 0
  for (let i = 0; i < upTo; i += 1) {
    sum += digits[i]! * (upTo + 1 - i)
  }

  const remainder = (sum * 10) % 11

  return remainder === 10 ? 0 : remainder
}

export type EmptyArea = {
  /** The spot itself, as the panel's map would hand it over. */
  query: string
  /** About 55 m north of it: the same place, seen by a phone's GPS a minute later. */
  nearbyQuery: string
}

/**
 * A spot in open country between Arapiraca and the coast, at least twenty kilometres from every
 * seeded point. Each test draws its own and registers what it needs there, so that nothing it does
 * changes the fixtures the public-facing specs assert on — an artisan of this suite linked to the
 * seeded fair would push Maria do Barro out of the three names a search card shows.
 */
export function anEmptyArea(): EmptyArea {
  const latitude = -9.3 - Math.random() * 0.25
  const longitude = -36.2 - Math.random() * 0.25

  return {
    query: `lat=${latitude.toFixed(5)}&lng=${longitude.toFixed(5)}`,
    nearbyQuery: `lat=${(latitude + 0.0005).toFixed(5)}&lng=${longitude.toFixed(5)}`,
  }
}

function generateMobile(): string {
  const line = Math.floor(Math.random() * 100_000_000)
    .toString()
    .padStart(8, '0')

  return `829${line}`
}
