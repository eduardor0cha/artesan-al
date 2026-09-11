import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * The search runs against the seeded database (`pnpm db:migrate && pnpm db:seed`), so these are
 * the real query, the real distances and the real page — not fixtures.
 */
const ARAPIRACA_SEARCH = '/?lat=-9.7519&lng=-36.6614&raio=10'

test.describe('busca por proximidade', () => {
  test('lista a feira de Arapiraca com a distância e quem vende ali', async ({ page }) => {
    await page.goto(ARAPIRACA_SEARCH)

    const card = page.getByRole('article').filter({ hasText: 'Feira do Artesanato de Arapiraca' })

    await expect(card).toBeVisible()
    await expect(card).toContainText('Maria do Barro')
    await expect(card).toContainText('de você')
  })

  test('deixa de fora um ponto além do raio pedido', async ({ page }) => {
    await page.goto(ARAPIRACA_SEARCH)

    // Maceió is about 110 km from Arapiraca, so it cannot appear in a 10 km search.
    await expect(page.getByText('Ateliê Josefa Fibras')).toHaveCount(0)
  })

  test('sem parâmetro nenhum, procura a partir de Maceió', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('article').filter({ hasText: 'Ateliê Josefa Fibras' }),
    ).toBeVisible()
  })

  test('aumentar a distância traz um ponto que estava de fora', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Mercado de Artesanato de Marechal Deodoro')).toHaveCount(0)

    await page.getByLabel('Distância').selectOption('25')
    await page.getByRole('button', { name: 'Buscar', exact: true }).click()

    await expect(
      page.getByRole('article').filter({ hasText: 'Mercado de Artesanato de Marechal Deodoro' }),
    ).toBeVisible()
  })

  test('o raio escolhido fica na URL, então a busca é compartilhável', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel('Distância').selectOption('25')
    await page.getByRole('button', { name: 'Buscar', exact: true }).click()

    await expect(page).toHaveURL(/raio=25/)
  })

  test('avisa quando a busca não encontra nada', async ({ page }) => {
    // Open sea off the coast: inside Alagoas' bounding box, far from every seeded point.
    await page.goto('/?lat=-9.2&lng=-34.9&raio=1')

    await expect(page.getByText('Nenhum ponto de venda encontrado')).toBeVisible()
  })

  test('recusa uma coordenada malformada em vez de mostrar outro lugar', async ({ page }) => {
    await page.goto('/?lat=aqui&lng=-36.6614&raio=10')

    // Scoped to the page's own content: Next.js keeps a route announcer with role="alert"
    // outside main, and an unscoped query would match that too.
    await expect(page.getByRole('main').getByRole('alert')).toBeVisible()
    await expect(page.getByText('Feira do Artesanato de Arapiraca')).toHaveCount(0)
  })

  /**
   * The list is rendered on the server precisely so that it survives a broken or blocked bundle;
   * the map is the enhancement on top, not the feature.
   */
  test.describe('com o JavaScript desativado', () => {
    test.use({ javaScriptEnabled: false })

    test('a lista de pontos de venda continua aparecendo', async ({ page }) => {
      await page.goto(ARAPIRACA_SEARCH)

      const card = page.getByRole('article').filter({ hasText: 'Feira do Artesanato de Arapiraca' })

      await expect(card).toBeVisible()
      await expect(card).toContainText('Maria do Barro')
    })
  })

  test('não tem violações de acessibilidade WCAG A/AA', async ({ page }) => {
    await page.goto(ARAPIRACA_SEARCH)

    // The map mounts only on the client; scanning before it settles would scan half a page.
    await expect(page.getByRole('region', { name: 'Mapa dos pontos de venda' })).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})
