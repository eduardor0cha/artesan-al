import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { anArtisanToSignUp, anEmptyArea, signOut, signUp, type EmptyArea } from './support/artisan'
import { alertOn } from './support/screen'

/**
 * Marking where an artisan sells. The spot travels in the query string exactly as the map would
 * send it, so the flow is exercised without simulating a drag.
 *
 * Every point these tests need is registered by the tests themselves, in an empty area of their
 * own: reusing the seeded fair would mean this suite quietly rewriting who sells there, which is
 * what the public search and the point's own page assert on.
 */

type RegisteredPoint = {
  name: string
  area: EmptyArea
}

test.describe('onde eu vendo', () => {
  test('um ponto já cadastrado é oferecido antes de deixar criar outro', async ({ page }) => {
    const point = await aPointRegisteredByAnotherArtisan(page)

    await signUp(page, anArtisanToSignUp())
    await page.goto(`/painel/onde-vendo/novo?${point.area.nearbyQuery}`)

    await expect(page.getByRole('heading', { name: point.name })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Vendo aqui' })).toBeVisible()

    // The form for a new point stays out of reach until the artisan says none of these is theirs.
    await expect(page.getByLabel('Nome do ponto')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Nenhum é o meu ponto/ })).toBeVisible()
  })

  test('quem reaproveita o ponto passa a aparecer na página dele', async ({ page }) => {
    const point = await aPointRegisteredByAnotherArtisan(page)
    const artisan = anArtisanToSignUp()

    await signUp(page, artisan)
    await page.goto(`/painel/onde-vendo/novo?${point.area.nearbyQuery}`)
    await page.getByRole('button', { name: 'Vendo aqui' }).click()

    await expect(page).toHaveURL(/\/painel\/onde-vendo/)
    await expect(alertOn(page)).toContainText(point.name)
    await expect(page.getByRole('link', { name: point.name })).toBeVisible()

    // The same point on the visitor's side now lists the artisan among who sells there.
    await page.getByRole('link', { name: point.name }).click()
    await expect(page.getByRole('link', { name: `Ver a página de ${artisan.name}` })).toBeVisible()
  })

  test('o ponto novo cadastrado no painel aparece na busca do visitante', async ({ page }) => {
    const area = anEmptyArea()

    await signUp(page, anArtisanToSignUp())

    // Nothing is registered out here, so the form opens without anything to offer first.
    await page.goto(`/painel/onde-vendo/novo?${area.query}`)
    await expect(page.getByText('Nenhum ponto cadastrado aqui perto.')).toBeVisible()

    const name = await registerPointHere(page, 'Estrada velha, sem número')

    await expect(page).toHaveURL(/\/painel\/onde-vendo/)
    await expect(page.getByRole('link', { name })).toBeVisible()

    await page.goto(`/?${area.query}&raio=10`)
    await expect(page.getByRole('link', { name })).toBeVisible()
  })

  test('o mesmo ponto não é vinculado duas vezes', async ({ page }) => {
    const point = await aPointRegisteredByAnotherArtisan(page)

    await signUp(page, anArtisanToSignUp())
    await page.goto(`/painel/onde-vendo/novo?${point.area.nearbyQuery}`)
    await page.getByRole('button', { name: 'Vendo aqui' }).click()
    await expect(page.getByRole('link', { name: point.name })).toBeVisible()

    await page.goto(`/painel/onde-vendo/novo?${point.area.nearbyQuery}`)
    await expect(page.getByText('Você já vende aqui')).toBeVisible()

    await page.goto('/painel/onde-vendo')
    await expect(page.getByRole('link', { name: point.name })).toHaveCount(1)
  })

  test('sem local marcado, a tela abre no mapa para escolher o ponto', async ({ page }) => {
    await signUp(page, anArtisanToSignUp())
    await page.goto('/painel/onde-vendo/novo')

    await expect(page.getByRole('region', { name: 'Mapa para marcar o local' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmar este local' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Usar minha localização' })).toBeVisible()
  })

  test('as telas de onde vendo não têm violações de acessibilidade WCAG A/AA', async ({ page }) => {
    const point = await aPointRegisteredByAnotherArtisan(page)

    await signUp(page, anArtisanToSignUp())

    // The map mounts only on the client; scanning before it settles would scan half a page.
    await expect(page.getByRole('region', { name: 'Mapa para marcar o local' })).toBeVisible()
    expect(await violationsOn(page)).toEqual([])

    await page.goto(`/painel/onde-vendo/novo?${point.area.nearbyQuery}`)
    await expect(page.getByRole('heading', { name: point.name })).toBeVisible()
    expect(await violationsOn(page)).toEqual([])

    await page.goto('/painel/onde-vendo')
    expect(await violationsOn(page)).toEqual([])
  })
})

/**
 * A point that exists before the artisan under test arrives, with an owner of its own — reusing a
 * point is only offered to someone who does not already sell there.
 */
async function aPointRegisteredByAnotherArtisan(page: Page): Promise<RegisteredPoint> {
  const area = anEmptyArea()

  await signUp(page, anArtisanToSignUp())
  await page.goto(`/painel/onde-vendo/novo?${area.query}`)

  const name = await registerPointHere(page)

  await expect(page.getByRole('link', { name })).toBeVisible()
  await signOut(page)

  return { name, area }
}

/** Fills the new-point form on the screen already open at the chosen spot. */
async function registerPointHere(page: Page, address?: string): Promise<string> {
  const name = `Ponto de Teste ${Math.random().toString(36).slice(2, 8)}`

  await page.getByLabel('Nome do ponto').fill(name)
  await page.getByLabel('Tipo do ponto').selectOption('fair')

  if (address) await page.getByLabel(/Endereço/).fill(address)

  await page.getByRole('button', { name: 'Cadastrar ponto' }).click()

  return name
}

async function violationsOn(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  return results.violations
}
