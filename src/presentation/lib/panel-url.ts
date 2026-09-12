import { routes } from './routes'
import { SEARCH_PARAM } from './search-url'

/**
 * What the panel says back to itself after a write. It travels in the query string, in pt-BR like
 * the rest of the URL, so the screen after an action is a page that can be reloaded or shared
 * rather than a state held in memory.
 */
export const PANEL_PARAM = {
  added: 'adicionado',
  saved: 'salvo',
  removed: 'removido',
  error: 'erro',
  /** Set once the artisan has seen the nearby points and none of them is theirs. */
  newPoint: 'novo',
} as const

export const POINT_GONE = 'ponto-indisponivel'
export const PRODUCT_GONE = 'peca-indisponivel'

export function whereISellHref(result: { added?: string; error?: string }): string {
  if (result.added) return `${routes.whereISell}?${PANEL_PARAM.added}=${result.added}`
  if (result.error) return `${routes.whereISell}?${PANEL_PARAM.error}=${result.error}`

  return routes.whereISell
}

/**
 * The same for the catalogue. A piece that was removed leaves no id to look up, so the flag is
 * just "1" and the screen says it in one sentence of its own.
 */
export function myProductsHref(result: {
  added?: string
  saved?: string
  removed?: boolean
  error?: string
}): string {
  if (result.added) return `${routes.myProducts}?${PANEL_PARAM.added}=${result.added}`
  if (result.saved) return `${routes.myProducts}?${PANEL_PARAM.saved}=${result.saved}`
  if (result.removed) return `${routes.myProducts}?${PANEL_PARAM.removed}=1`
  if (result.error) return `${routes.myProducts}?${PANEL_PARAM.error}=${result.error}`

  return routes.myProducts
}

/** The spot travels in the query string, like the public search, so the step is reloadable. */
export function newSalesPointHref(spot: {
  latitude: number
  longitude: number
  creating?: boolean
}): string {
  const params = new URLSearchParams({
    [SEARCH_PARAM.latitude]: String(spot.latitude),
    [SEARCH_PARAM.longitude]: String(spot.longitude),
  })

  if (spot.creating) params.set(PANEL_PARAM.newPoint, '1')

  return `${routes.newSalesPoint}?${params.toString()}`
}
