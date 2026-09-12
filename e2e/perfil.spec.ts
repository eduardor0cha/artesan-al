import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { DEMO_ARTISAN } from '@/infrastructure/db/demo-account'

import { anArtisanToSignUp, signUp } from './support/artisan'
import { alertOn } from './support/screen'

/**
 * The artisan writing their own page, and the overview that tells them whether it is ready.
 *
 * The account under test is created by the test, as everywhere in this suite. The one exception is
 * the demonstration account, which is read-only here: it belongs to the seed, and the public specs
 * assert on the very data it holds.
 */
test.describe('perfil e visão geral', () => {
  test('o que o artesão escreve no perfil é o que o visitante lê', async ({ page }) => {
    const artisan = anArtisanToSignUp()

    await signUp(page, artisan)
    await page.goto('/painel/perfil')

    await page.getByLabel(/Seu ofício/).fill('Cerâmica utilitária')
    await page.getByLabel(/Sua cidade/).fill('Arapiraca')
    await page.getByLabel(/Sua história/).fill('Aprendi o barro com minha mãe, aos doze anos.')
    await page.getByLabel(/Registro de artesão/).fill('AL-2020-0001')
    await page.getByLabel('Celular para o cliente chamar').fill('82988881234')
    await page.getByRole('button', { name: 'Salvar meu perfil' }).click()

    await expect(alertOn(page)).toContainText('Perfil salvo.')

    await page.getByRole('link', { name: 'Ver minha página' }).click()

    await expect(page.getByText('Cerâmica utilitária')).toBeVisible()
    await expect(page.getByText('Arapiraca')).toBeVisible()
    await expect(page.getByText('Aprendi o barro com minha mãe')).toBeVisible()
    await expect(page.getByText('AL-2020-0001')).toBeVisible()

    // The public number is what the WhatsApp button dials, in the international shape.
    const talk = page.getByRole('link', { name: 'Falar no WhatsApp' })
    await expect(talk).toHaveAttribute('href', /5582988881234/)
  })

  test('um celular que não recebe WhatsApp é recusado e nada muda', async ({ page }) => {
    const artisan = anArtisanToSignUp()

    await signUp(page, artisan)
    await page.goto('/painel/perfil')

    await page.getByLabel('Celular para o cliente chamar').fill('8233334444')
    await page.getByRole('button', { name: 'Salvar meu perfil' }).click()

    await expect(alertOn(page)).toContainText('celular')

    await page.reload()
    await expect(page.getByLabel('Celular para o cliente chamar')).toHaveValue(artisan.phone)
  })

  /** The address of a page is shared by hand; nothing in the panel may move it. */
  test('editar o perfil não muda o endereço da página', async ({ page }) => {
    await signUp(page, anArtisanToSignUp())
    await page.getByRole('link', { name: 'Ver minha página' }).click()

    const address = page.url()

    await page.goto('/painel/perfil')
    await page.getByLabel(/Sua cidade/).fill('Maceió')
    await page.getByRole('button', { name: 'Salvar meu perfil' }).click()
    await expect(alertOn(page)).toContainText('Perfil salvo.')

    await page.getByRole('link', { name: 'Ver minha página' }).click()
    expect(page.url()).toBe(address)
  })

  test('a visão geral conta o que já existe na conta', async ({ page }) => {
    await signUp(page, anArtisanToSignUp())
    await page.goto('/painel')

    await expect(page.getByText('Você ainda não marcou onde vende.')).toBeVisible()
    await expect(page.getByText('Você ainda não publicou nenhuma peça.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Marcar onde eu vendo' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Publicar uma peça' })).toBeVisible()
  })

  /**
   * The account an evaluator signs in with. It is the guarantee that `pnpm db:seed` produces a
   * usable login — the credentials are written by Better Auth, not by hand — and that the panel
   * of an artisan who already sells and publishes renders.
   */
  test('a conta de demonstração do seed entra e mostra a conta já preenchida', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByLabel('CPF').fill(DEMO_ARTISAN.cpf)
    await page.getByLabel('Senha').fill(DEMO_ARTISAN.password)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/painel$/)
    await expect(page.getByText(`Olá, ${DEMO_ARTISAN.name}.`)).toBeVisible()
    await expect(page.getByText('Você vende em 1 ponto.')).toBeVisible()
    await expect(page.getByText('Você tem 2 peças publicadas.')).toBeVisible()
    await expect(page.getByRole('link', { name: `/artesaos/${DEMO_ARTISAN.slug}` })).toBeVisible()
  })

  test('as telas de perfil e visão geral não têm violações de acessibilidade WCAG A/AA', async ({
    page,
  }) => {
    await signUp(page, anArtisanToSignUp())

    for (const path of ['/painel', '/painel/perfil']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      expect(await violationsOn(page)).toEqual([])
    }
  })
})

async function violationsOn(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  return results.violations
}
