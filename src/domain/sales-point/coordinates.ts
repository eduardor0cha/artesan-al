import { domainError, err, ok, type Result } from '../shared/result'

/**
 * A WGS 84 point. Latitude and longitude arrive from the browser's Geolocation API or from a pin
 * the artisan drags on the map, so they are validated before they can reach a spatial query.
 */
export class Coordinates {
  private constructor(
    readonly latitude: number,
    readonly longitude: number,
  ) {}

  static create(latitude: number, longitude: number): Result<Coordinates> {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return err(domainError('coordinates.invalid_latitude', 'Latitude fora do intervalo válido.'))
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return err(
        domainError('coordinates.invalid_longitude', 'Longitude fora do intervalo válido.'),
      )
    }

    return ok(new Coordinates(latitude, longitude))
  }
}
