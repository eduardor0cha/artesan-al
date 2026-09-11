import { domainError, err, ok, type Result } from '../shared/result'

const MIN_RADIUS_KM = 0.1
const MAX_RADIUS_KM = 100
const DEFAULT_RADIUS_KM = 10

/**
 * Caps how wide a proximity search may be. Without this bound a caller could ask for a radius that
 * covers the whole country, which makes the GiST index useless and turns every search into a table
 * scan.
 */
export class SearchRadius {
  private constructor(readonly kilometers: number) {}

  static create(kilometers: number): Result<SearchRadius> {
    if (!Number.isFinite(kilometers)) {
      return err(domainError('search_radius.not_a_number', 'O raio de busca é inválido.'))
    }

    if (kilometers < MIN_RADIUS_KM || kilometers > MAX_RADIUS_KM) {
      return err(
        domainError(
          'search_radius.out_of_range',
          `O raio de busca deve estar entre ${MIN_RADIUS_KM} e ${MAX_RADIUS_KM} km.`,
        ),
      )
    }

    return ok(new SearchRadius(kilometers))
  }

  static default(): SearchRadius {
    return new SearchRadius(DEFAULT_RADIUS_KM)
  }

  get meters(): number {
    return this.kilometers * 1000
  }
}
