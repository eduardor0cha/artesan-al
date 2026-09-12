import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { anArtisanToSignUp, signIn, signOut, signUp } from './support/artisan'

/**
 * The artisan's way in: create an account with CPF and password, leave, come back, and ask for a
 * code when the password is gone. Every account here is created by the test itself — sign-up is
 * the only door, and there is no fixture account in the seed yet.
 */
test.describe('conta do artesão', () => {
  test('um CPF novo cria conta e cai no primeiro passo guiado', async ({ page }) => {
    await signUp(page, anArtisanToSignUp())

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Marcar onde eu vendo')
  })

  test('um CPF já cadastrado é recusado com mensagem clara', async ({ page }) => {
    const artisan = anArtisanToSignUp()

    await signUp(page, artisan)
    await signOut(page)

    // The same document, from someone who forgot they already signed up.
    await page.goto('/criar-conta')
    await page.getByLabel('Seu nome').fill('Outro Nome')
    await page.getByLabel('CPF').fill(artisan.cpf)
    await page.getByLabel('Celular com DDD').fill('82988887777')
    await page.getByLabel('Senha').fill('outra-senha-1')
    await page.getByRole('button', { name: 'Criar minha conta' }).click()

    await expect(page.getByRole('alert')).toContainText('Este CPF já tem uma conta')
    await expect(page).toHaveURL(/\/criar-conta/)
  })

  test('um CPF que não é um documento é recusado antes de criar qualquer coisa', async ({
    page,
  }) => {
    await page.goto('/criar-conta')
    await page.getByLabel('Seu nome').fill('Artesã de Teste')
    await page.getByLabel('CPF').fill('111.111.111-11')
    await page.getByLabel('Celular com DDD').fill('82988887766')
    await page.getByLabel('Senha').fill('senha-de-teste-1')
    await page.getByRole('button', { name: 'Criar minha conta' }).click()

    await expect(page.getByRole('alert')).toContainText('não é válido')
  })

  test('o painel manda para a tela de entrar quem não entrou', async ({ page }) => {
    await page.goto('/painel')

    await expect(page).toHaveURL(/\/entrar/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Entrar')
  })

  test('quem saiu entra de novo com o CPF e a senha', async ({ page }) => {
    const artisan = anArtisanToSignUp()

    await signUp(page, artisan)
    await signOut(page)
    await signIn(page, artisan)

    await expect(page).toHaveURL(/\/painel$/)
    await expect(page.getByText(artisan.name)).toBeVisible()
  })

  test('uma senha errada não diz se o CPF existe', async ({ page }) => {
    const artisan = anArtisanToSignUp()

    await signUp(page, artisan)
    await signOut(page)
    await signIn(page, { ...artisan, password: 'senha-errada-1' })

    await expect(page.getByRole('alert')).toContainText('CPF ou senha não conferem')
  })

  /** The document is the login identifier: it may not reach a page, a URL or a log (LGPD). */
  test('o CPF não aparece na página pública do artesão nem na URL do painel', async ({ page }) => {
    const artisan = anArtisanToSignUp()

    await signUp(page, artisan)

    expect(page.url()).not.toContain(artisan.cpf)

    const publicPage = page.getByRole('link', { name: 'Ver minha página' })
    await publicPage.click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(artisan.name)
    expect(page.url()).not.toContain(artisan.cpf)
    await expect(page.getByText(artisan.cpf)).toHaveCount(0)
    await expect(page.getByText(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/)).toHaveCount(0)
  })

  test('quem esqueceu a senha pede um código para o celular', async ({ page }) => {
    const artisan = anArtisanToSignUp()

    await signUp(page, artisan)
    await signOut(page)

    await page.goto('/esqueci-minha-senha')
    await page.getByLabel('Celular com DDD').fill(artisan.phone)
    await page.getByRole('button', { name: 'Receber o código' }).click()

    // No SMS provider is contracted, so what is asserted is the step, not the code itself.
    await expect(page.getByText('o código chega em instantes')).toBeVisible()
    await expect(page.getByLabel('Código que chegou no celular')).toBeVisible()
  })

  test('um código errado não troca a senha', async ({ page }) => {
    const artisan = anArtisanToSignUp()

    await signUp(page, artisan)
    await signOut(page)

    await page.goto('/esqueci-minha-senha')
    await page.getByLabel('Celular com DDD').fill(artisan.phone)
    await page.getByRole('button', { name: 'Receber o código' }).click()

    await page.getByLabel('Código que chegou no celular').fill('000000')
    await page.getByLabel('Nova senha').fill('nova-senha-1')
    await page.getByRole('button', { name: 'Salvar a nova senha' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('as telas de conta não têm violações de acessibilidade WCAG A/AA', async ({ page }) => {
    for (const path of ['/criar-conta', '/entrar', '/esqueci-minha-senha']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      expect(await violationsOn(page)).toEqual([])
    }
  })

  test('o painel não tem violações de acessibilidade WCAG A/AA', async ({ page }) => {
    await signUp(page, anArtisanToSignUp())
    await page.goto('/painel')

    expect(await violationsOn(page)).toEqual([])
  })
})

async function violationsOn(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  return results.violations
}
