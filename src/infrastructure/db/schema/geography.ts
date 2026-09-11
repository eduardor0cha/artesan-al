import { customType } from 'drizzle-orm/pg-core'

export type GeographyPoint = { latitude: number; longitude: number }

const WGS84 = 4326

/**
 * Drizzle ships a `geometry` column type but no `geography`. Geography is what this project needs:
 * ST_DWithin over geography takes a radius in metres and computes distance on the spheroid, so
 * results stay correct without projecting Alagoas into a local CRS.
 *
 * The column is declared as the `geography_point` DOMAIN (created in migration 0000) rather than
 * as `geography(Point,4326)` directly: drizzle-kit renders an unknown type as a quoted identifier,
 * and `"geography(Point,4326)"` is not valid SQL. A domain is a single identifier, so it survives
 * that quoting — and Postgres still uses the GiST index and PostGIS functions through it.
 */
export const geographyPoint = customType<{
  data: GeographyPoint
  driverData: string
}>({
  dataType() {
    return 'geography_point'
  },

  toDriver(value) {
    return `SRID=${WGS84};POINT(${value.longitude} ${value.latitude})`
  },

  fromDriver(value) {
    return parseEwkbPoint(value)
  },
})

/**
 * PostGIS returns geography values as hex-encoded EWKB. Only the 2D point case is handled, which
 * is the only shape this schema stores.
 */
export function parseEwkbPoint(hex: string): GeographyPoint {
  const bytes = Buffer.from(hex, 'hex')

  if (bytes.length < 21) {
    throw new Error(`EWKB inesperado para um ponto: ${hex}`)
  }

  const littleEndian = bytes.readUInt8(0) === 1
  const typeWord = littleEndian ? bytes.readUInt32LE(1) : bytes.readUInt32BE(1)
  const hasSrid = (typeWord & 0x20000000) !== 0
  const offset = hasSrid ? 9 : 5

  const longitude = littleEndian ? bytes.readDoubleLE(offset) : bytes.readDoubleBE(offset)
  const latitude = littleEndian ? bytes.readDoubleLE(offset + 8) : bytes.readDoubleBE(offset + 8)

  return { latitude, longitude }
}
