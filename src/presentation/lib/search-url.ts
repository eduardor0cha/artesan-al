/**
 * The search lives in the query string, not in component state: that is what keeps the results
 * server-rendered, shareable over WhatsApp and reachable without JavaScript. Parameter names are
 * pt-BR like the rest of the public URL (ADR 0010).
 */
export const SEARCH_PARAM = {
  latitude: 'lat',
  longitude: 'lng',
  radius: 'raio',
} as const

export type RawSearchParams = Record<string, string | string[] | undefined>

export type SearchQuery = {
  latitude?: number
  longitude?: number
  radiusKilometers?: number
}

/**
 * An absent parameter becomes `undefined`, so the use case applies its default. A malformed one
 * becomes `NaN` on purpose: the domain rejects it and the visitor is told, rather than being shown
 * results for somewhere they did not ask about.
 */
export function parseSearchQuery(params: RawSearchParams): SearchQuery {
  return {
    latitude: toNumber(params[SEARCH_PARAM.latitude]),
    longitude: toNumber(params[SEARCH_PARAM.longitude]),
    radiusKilometers: toNumber(params[SEARCH_PARAM.radius]),
  }
}

export function buildSearchHref(search: {
  latitude: number
  longitude: number
  radiusKilometers: number
}): string {
  const params = new URLSearchParams({
    [SEARCH_PARAM.latitude]: formatCoordinate(search.latitude),
    [SEARCH_PARAM.longitude]: formatCoordinate(search.longitude),
    [SEARCH_PARAM.radius]: String(search.radiusKilometers),
  })

  return `/?${params.toString()}`
}

function toNumber(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value

  if (raw === undefined || raw.trim() === '') return undefined

  return Number(raw)
}

/** Five decimals is about a metre — enough for a search, and it keeps a shared link short. */
function formatCoordinate(value: number): string {
  return value.toFixed(5)
}
