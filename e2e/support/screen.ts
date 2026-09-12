import type { Locator, Page } from '@playwright/test'

/**
 * The message the screen is giving back. It is scoped to `main` because Next keeps its own
 * `role="alert"` route announcer in the document at all times, outside every landmark: an
 * unscoped lookup matches two elements and fails Playwright's strict mode before it ever reads
 * the text.
 */
export function alertOn(page: Page): Locator {
  return page.getByRole('main').getByRole('alert')
}
