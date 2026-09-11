import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * The visitor's whole path through the public pages, against the seeded database
 * (`pnpm db:migrate && pnpm db:seed`): search, point, artisan, piece, WhatsApp.
 */
const ARAPIRACA_SEARCH = '/?lat=-9.7519&lng=-36.6614&raio=10'

async function openFairFromSearch(page: Page) {
  await page.goto(ARAPIRACA_SEARCH)
  await page.getByRole('link', { name: 'Feira do Artesanato de Arapiraca' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Feira do Artesanato de Arapiraca',
  )
}

async function openMariaProfile(page: Page) {
  await openFairFromSearch(page)
  await page.getByRole('link', { name: 'Ver a página de Maria do Barro' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Maria do Barro')
}

async function openMoringa(page: Page) {
  await openMariaProfile(page)
  await page.getByRole('link', { name: 'Moringa de barro' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Moringa de barro')
}

test.describe('páginas públicas', () => {
  test('o ponto de venda mostra endereço, horário e quem vende ali', async ({ page }) => {
    await openFairFromSearch(page)

    await expect(page).toHaveURL(/\/pontos-de-venda\//)
    await expect(page.getByText('Centro, Arapiraca')).toBeVisible()
    await expect(page.getByText('Sábados, das 6h às 12h')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ver a página de Maria do Barro' })).toBeVisible()
  })

  test('a página do artesão traz ofício, história, registro e catálogo', async ({ page }) => {
    await openMariaProfile(page)

    await expect(page).toHaveURL(/\/artesaos\/maria-do-barro$/)
    await expect(page.getByText('Cerâmica utilitária')).toBeVisible()
    await expect(page.getByText('barro do Agreste')).toBeVisible()
    await expect(page.getByText('AL-2018-0413')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Moringa de barro' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Feira do Artesanato de Arapiraca' })).toBeVisible()
  })

  /** The CPF is the login identifier and must never surface on a public page (LGPD). */
  test('nenhuma página pública mostra CPF', async ({ page }) => {
    await openMariaProfile(page)

    await expect(page.getByText(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/)).toHaveCount(0)
  })

  test('a peça leva ao WhatsApp com a mensagem já escrita', async ({ page }) => {
    await openMoringa(page)

    await expect(page).toHaveURL(/\/produtos\//)
    // Intl puts a non-breaking space after R$, so the assertion matches the digits only.
    await expect(page.getByText(/85,00/)).toBeVisible()

    const whatsApp = page.getByRole('link', { name: 'Falar no WhatsApp' })
    const href = await whatsApp.getAttribute('href')

    expect(href).toContain('https://wa.me/5582999120001')
    expect(href).toContain(encodeURIComponent('Moringa de barro'))
  })

  test('a peça diz onde comprar e quem fez', async ({ page }) => {
    await openMoringa(page)

    await expect(page.getByRole('link', { name: 'Ver a página de Maria do Barro' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Feira do Artesanato de Arapiraca' })).toBeVisible()
  })

  test('o link de uma peça fica apresentável quando colado numa conversa', async ({ page }) => {
    await openMoringa(page)

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      /Moringa de barro/,
    )
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      'content',
      /Maria do Barro/,
    )
    await expect(page).toHaveTitle(/Moringa de barro/)
  })

  test('um endereço que não existe mostra a página de não encontrado, em português', async ({
    page,
  }) => {
    const response = await page.goto('/artesaos/nao-existe')

    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página não encontrada')
  })

  test('um identificador malformado não vira erro de servidor', async ({ page }) => {
    const response = await page.goto('/produtos/isso-nao-e-um-id')

    expect(response?.status()).toBe(404)
  })

  /** The list of sellers is server-rendered; the map beside it is the enhancement. */
  test.describe('com o JavaScript desativado', () => {
    test.use({ javaScriptEnabled: false })

    test('o ponto de venda continua listando quem vende ali', async ({ page }) => {
      await page.goto(ARAPIRACA_SEARCH)

      const link = page.getByRole('link', { name: 'Feira do Artesanato de Arapiraca' })
      await link.click()

      await expect(page.getByRole('link', { name: 'Ver a página de Maria do Barro' })).toBeVisible()
    })
  })

  test('o ponto de venda não tem violações de acessibilidade WCAG A/AA', async ({ page }) => {
    await openFairFromSearch(page)

    // The map mounts only on the client; scanning before it settles would scan half a page.
    await expect(page.getByRole('region', { name: 'Mapa do ponto de venda' })).toBeVisible()

    expect(await violationsOn(page)).toEqual([])
  })

  test('a página do artesão não tem violações de acessibilidade WCAG A/AA', async ({ page }) => {
    await openMariaProfile(page)

    expect(await violationsOn(page)).toEqual([])
  })

  test('a página da peça não tem violações de acessibilidade WCAG A/AA', async ({ page }) => {
    await openMoringa(page)

    expect(await violationsOn(page)).toEqual([])
  })
})

async function violationsOn(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  return results.violations
}
