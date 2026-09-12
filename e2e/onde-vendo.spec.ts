import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

import { anArtisanToSignUp, anEmptyArea, signUp } from './support/artisan'

/**
 * Marking where an artisan sells, against the seeded database. The spot travels in the query
 * string exactly as the map would send it, so the flow is exercised without simulating a drag.
 */

/** About 55 m north of the seeded Feira do Artesanato de Arapiraca. */
const NEXT_TO_THE_FAIR = '?lat=-9.75140&lng=-36.66140'

const FAIR = 'Feira do Artesanato de Arapiraca'

test.describe('onde eu vendo', () => {
  test('a feira já cadastrada é oferecida antes de deixar criar outra', async ({ page }) => {
    await signUp(page, anArtisanToSignUp())
    await page.goto(`/painel/onde-vendo/novo${NEXT_TO_THE_FAIR}`)

    await expect(page.getByRole('heading', { name: FAIR })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Vendo aqui' })).toBeVisible()

    // The form for a new point stays out of reach until the artisan says none of these is theirs.
    await expect(page.getByLabel('Nome do ponto')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Nenhum é o meu ponto/ })).toBeVisible()
  })

  test('quem reaproveita a feira passa a aparecer na página dela', async ({ page }) => {
    const artisan = anArtisanToSignUp()

    await signUp(page, artisan)
    await page.goto(`/painel/onde-vendo/novo${NEXT_TO_THE_FAIR}`)
    await page.getByRole('button', { name: 'Vendo aqui' }).click()

    await expect(page).toHaveURL(/\/painel\/onde-vendo/)
    await expect(page.getByRole('alert')).toContainText(FAIR)
    await expect(page.getByRole('link', { name: FAIR })).toBeVisible()

    // The same fair on the visitor's side now lists the artisan among who sells there.
    await page.getByRole('link', { name: FAIR }).click()
    await expect(page.getByRole('link', { name: `Ver a página de ${artisan.name}` })).toBeVisible()
  })

  test('o ponto novo cadastrado no painel aparece na busca do visitante', async ({ page }) => {
    const pointName = `Feira de Teste ${Math.random().toString(36).slice(2, 8)}`
    const area = anEmptyArea()

    await signUp(page, anArtisanToSignUp())

    // Nothing is registered out here, so the form opens without anything to offer first.
    await page.goto(`/painel/onde-vendo/novo?${area.query}`)
    await expect(page.getByText('Nenhum ponto cadastrado aqui perto.')).toBeVisible()

    await page.getByLabel('Nome do ponto').fill(pointName)
    await page.getByLabel('Tipo do ponto').selectOption('fair')
    await page.getByLabel(/Endereço/).fill('Estrada velha, sem número')
    await page.getByRole('button', { name: 'Cadastrar ponto' }).click()

    await expect(page).toHaveURL(/\/painel\/onde-vendo/)
    await expect(page.getByRole('link', { name: pointName })).toBeVisible()

    await page.goto(`/?${area.query}&raio=10`)
    await expect(page.getByRole('link', { name: pointName })).toBeVisible()
  })

  test('o mesmo ponto não é vinculado duas vezes', async ({ page }) => {
    await signUp(page, anArtisanToSignUp())

    await page.goto(`/painel/onde-vendo/novo${NEXT_TO_THE_FAIR}`)
    await page.getByRole('button', { name: 'Vendo aqui' }).click()
    await expect(page.getByRole('link', { name: FAIR })).toBeVisible()

    await page.goto(`/painel/onde-vendo/novo${NEXT_TO_THE_FAIR}`)
    await expect(page.getByText('Você já vende aqui')).toBeVisible()

    await page.goto('/painel/onde-vendo')
    await expect(page.getByRole('link', { name: FAIR })).toHaveCount(1)
  })

  test('sem local marcado, a tela abre no mapa para escolher o ponto', async ({ page }) => {
    await signUp(page, anArtisanToSignUp())
    await page.goto('/painel/onde-vendo/novo')

    await expect(page.getByRole('region', { name: 'Mapa para marcar o local' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmar este local' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Usar minha localização' })).toBeVisible()
  })

  test('as telas de onde vendo não têm violações de acessibilidade WCAG A/AA', async ({ page }) => {
    await signUp(page, anArtisanToSignUp())

    // The map mounts only on the client; scanning before it settles would scan half a page.
    await expect(page.getByRole('region', { name: 'Mapa para marcar o local' })).toBeVisible()
    expect(await violationsOn(page)).toEqual([])

    await page.goto(`/painel/onde-vendo/novo${NEXT_TO_THE_FAIR}`)
    await expect(page.getByRole('heading', { name: FAIR })).toBeVisible()
    expect(await violationsOn(page)).toEqual([])

    await page.goto('/painel/onde-vendo')
    expect(await violationsOn(page)).toEqual([])
  })
})

async function violationsOn(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  return results.violations
}
