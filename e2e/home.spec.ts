import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('página inicial', () => {
  test('carrega e anuncia o nome da plataforma', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ArtesanAL')
  })

  test('declara o idioma pt-BR, para leitores de tela pronunciarem corretamente', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  })

  test('expõe o manifest necessário para instalar como aplicativo', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest')

    expect(response.ok()).toBe(true)

    const manifest = await response.json()
    expect(manifest.name).toContain('ArtesanAL')
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2)
  })

  /**
   * Accessibility is a requirement of this project, so a violation fails the build like any other
   * defect. Scoped to WCAG 2.1/2.2 A and AA, which is the level the project committed to.
   */
  test('não tem violações de acessibilidade WCAG A/AA', async ({ page }) => {
    await page.goto('/')

    // The map mounts only on the client; scanning before it settles would scan half a page.
    await expect(page.getByRole('region', { name: 'Mapa dos pontos de venda' })).toBeVisible()

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })
})
