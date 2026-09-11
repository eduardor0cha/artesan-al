import { eq, sql } from 'drizzle-orm'

import type { NearbySearch, SalesPointRepository } from '@/application/ports/sales-point.repository'
import { Coordinates } from '@/domain/sales-point/coordinates'
import type { NearbySalesPoint, SalesPoint, SalesPointId } from '@/domain/sales-point/sales-point'
import type { SalesPointType } from '@/domain/sales-point/sales-point-type'

import type { Database } from '../client'
import { salesPoints } from '../schema/sales-points'

type SalesPointRow = {
  id: string
  name: string
  type: SalesPointType
  latitude: number
  longitude: number
  address: string | null
  opening_hours: string | null
  created_by: string
  created_at: Date
  distance_meters?: number
}

export class DrizzleSalesPointRepository implements SalesPointRepository {
  constructor(private readonly db: Database) {}

  /**
   * ST_DWithin over geography filters in metres on the spheroid and is the operation the GiST
   * index accelerates; the `<->` operator then orders by true distance. Written as raw SQL because
   * neither is expressible through Drizzle's query builder.
   */
  async findNearby(search: NearbySearch): Promise<NearbySalesPoint[]> {
    const { center, radius, limit = 50 } = search
    const point = sql`ST_SetSRID(ST_MakePoint(${center.longitude}, ${center.latitude}), 4326)::geography`

    const rows = await this.db.execute<SalesPointRow>(sql`
      select
        id,
        name,
        type,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude,
        address,
        opening_hours,
        created_by,
        created_at,
        ST_Distance(location, ${point}) as distance_meters
      from sales_points
      where ST_DWithin(location, ${point}, ${radius.meters})
      order by location <-> ${point}
      limit ${limit}
    `)

    return rows.map((row) => ({
      salesPoint: toSalesPoint(row),
      distanceMeters: Number(row.distance_meters),
    }))
  }

  async findById(id: SalesPointId): Promise<SalesPoint | null> {
    const rows = await this.db.execute<SalesPointRow>(sql`
      select
        id,
        name,
        type,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude,
        address,
        opening_hours,
        created_by,
        created_at
      from sales_points
      where id = ${id}
    `)

    const row = rows.at(0)
    return row ? toSalesPoint(row) : null
  }

  async save(salesPoint: SalesPoint): Promise<void> {
    const values = {
      id: salesPoint.id,
      name: salesPoint.name,
      type: salesPoint.type,
      location: {
        latitude: salesPoint.coordinates.latitude,
        longitude: salesPoint.coordinates.longitude,
      },
      address: salesPoint.address,
      openingHours: salesPoint.openingHours,
      createdBy: salesPoint.createdBy,
    }

    await this.db
      .insert(salesPoints)
      .values(values)
      .onConflictDoUpdate({ target: salesPoints.id, set: values })
  }

  async deleteById(id: SalesPointId): Promise<void> {
    await this.db.delete(salesPoints).where(eq(salesPoints.id, id))
  }
}

function toSalesPoint(row: SalesPointRow): SalesPoint {
  const coordinates = Coordinates.create(Number(row.latitude), Number(row.longitude))

  if (!coordinates.ok) {
    // Coordinates were validated before being stored, so a failure here means the row was written
    // by something other than this application.
    throw new Error(`Ponto de venda ${row.id} tem coordenadas inválidas no banco.`)
  }

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    coordinates: coordinates.value,
    address: row.address,
    openingHours: row.opening_hours,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}
