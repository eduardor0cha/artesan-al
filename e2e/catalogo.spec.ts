import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { anArtisanToSignUp, signUp } from './support/artisan'
import { alertOn } from './support/screen'

/**
 * Publishing, correcting and withdrawing a piece, and what the visitor sees on the other side.
 *
 * Every account and every piece here is created by the test itself: the seeded artisans are what
 * the public-facing specs assert on, and a piece added to one of them would change the catalogue
 * those tests count.
 */

/** A 1x1 PNG. The browser only has to decode it — the reduction is what is under test, not the art. */
const A_PHOTO = {
  name: 'peca.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  ),
}

const ALT = 'Moringa de barro sobre uma mesa de madeira'

test.describe('catálogo', () => {
  test('a peça publicada no painel aparece na página do artesão e na dela', async ({ page }) => {
    const artisan = anArtisanToSignUp()

    await signUp(page, artisan)

    const piece = await publishAPiece(page, { price: '85,00' })

    await expect(page).toHaveURL(/\/painel\/produtos(\?|$)/)
    await expect(alertOn(page)).toContainText(piece)

    // The artisan's own public page, reached the way they reach it: from the panel header.
    await page.getByRole('link', { name: 'Ver minha página' }).click()
    await expect(page.getByRole('heading', { name: artisan.name })).toBeVisible()

    const card = page.getByRole('link', { name: new RegExp(piece) })
    await expect(card).toBeVisible()
    await expect(page.getByRole('img', { name: ALT }).first()).toBeVisible()

    await card.click()
    await expect(page.getByRole('heading', { name: piece })).toBeVisible()
    await expect(page.getByRole('img', { name: ALT }).first()).toBeVisible()
    await expect(page.getByText(/85,00/)).toBeVisible()
  })

  /** The photo is reduced by the browser, so what reaches the bucket is never the original file. */
  test('a foto é servida pelo armazenamento e abre sozinha', async ({ page, request }) => {
    await signUp(page, anArtisanToSignUp())
    await publishAPiece(page)

    await page.getByRole('link', { name: 'Ver minha página' }).click()

    const source = await page.getByRole('img', { name: ALT }).first().getAttribute('src')
    expect(source).toBeTruthy()

    const response = await request.get(new URL(source!, page.url()).toString())
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image')
  })

  test('editar a peça troca o que o visitante lê', async ({ page }) => {
    const artisan = anArtisanToSignUp()

    await signUp(page, artisan)

    const piece = await publishAPiece(page, { price: '85,00' })

    await page.getByRole('link', { name: `Editar ${piece}` }).click()
    await page.getByLabel('Preço em reais').fill('120,00')
    await page.getByRole('button', { name: 'Salvar mudanças' }).click()

    await expect(alertOn(page)).toContainText(piece)

    await page.getByRole('link', { name: 'Ver minha página' }).click()
    await page.getByRole('link', { name: new RegExp(piece) }).click()
    await expect(page.getByText(/120,00/)).toBeVisible()
  })

  test('a peça retirada sai da página pública', async ({ page }) => {
    await signUp(page, anArtisanToSignUp())

    const piece = await publishAPiece(page)

    await page.getByRole('link', { name: `Editar ${piece}` }).click()
    await page.getByText('Tirar esta peça da minha página').click()
    await page.getByRole('button', { name: 'Sim, tirar a peça' }).click()

    await expect(alertOn(page)).toContainText('A peça saiu da sua página.')
    await expect(page.getByRole('link', { name: `Editar ${piece}` })).toHaveCount(0)

    await page.getByRole('link', { name: 'Ver minha página' }).click()
    await expect(page.getByRole('link', { name: new RegExp(piece) })).toHaveCount(0)
  })

  test('o preço em branco vira "a combinar" e um preço escrito errado é recusado', async ({
    page,
  }) => {
    await signUp(page, anArtisanToSignUp())
    await page.goto('/painel/produtos/nova-peca')

    await page.getByLabel('Nome da peça').fill('Cesto redondo')
    await page.getByLabel(/Preço em reais/).fill('uns oitenta')
    await page.getByRole('button', { name: 'Publicar peça' }).click()

    await expect(alertOn(page)).toContainText('Escreva o preço como em 85,00.')

    await page.getByLabel(/Preço em reais/).fill('')
    await page.getByRole('button', { name: 'Publicar peça' }).click()

    await expect(page).toHaveURL(/\/painel\/produtos(\?|$)/)
    await expect(page.getByText('Preço a combinar')).toBeVisible()
  })

  test('as telas do catálogo não têm violações de acessibilidade WCAG A/AA', async ({ page }) => {
    await signUp(page, anArtisanToSignUp())

    await page.goto('/painel/produtos')
    expect(await violationsOn(page)).toEqual([])

    const piece = await publishAPiece(page)
    expect(await violationsOn(page)).toEqual([])

    await page.getByRole('link', { name: `Editar ${piece}` }).click()
    await expect(page.getByLabel('Nome da peça')).toHaveValue(piece)
    expect(await violationsOn(page)).toEqual([])
  })
})

/**
 * Publishes a piece with its photo from the panel, leaving the browser on the list afterwards.
 * The name is drawn per call because these accounts and their catalogues stay in the database.
 */
async function publishAPiece(page: Page, options: { price?: string } = {}): Promise<string> {
  const name = `Moringa de Teste ${Math.random().toString(36).slice(2, 8)}`

  await page.goto('/painel/produtos/nova-peca')
  await page.getByLabel('Nome da peça').fill(name)

  if (options.price) await page.getByLabel(/Preço em reais/).fill(options.price)

  await page.getByLabel(/Foto do produto/).setInputFiles(A_PHOTO)

  // The file only replaces what the field holds once the canvas has finished with it.
  await expect(page.getByText('Foto pronta para subir.')).toBeVisible()

  await page.getByLabel('Descreva a foto').fill(ALT)
  await page.getByRole('button', { name: 'Publicar peça' }).click()

  await expect(page).toHaveURL(/\/painel\/produtos(\?|$)/)

  return name
}

async function violationsOn(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  return results.violations
}
