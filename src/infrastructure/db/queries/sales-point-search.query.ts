import { sql } from 'drizzle-orm'

import type {
  NearbySalesPointSearch,
  NearbySalesPointSummary,
  SalesPointSearchQuery,
} from '@/application/ports/sales-point-search.query'
import { Coordinates } from '@/domain/sales-point/coordinates'
import type { SalesPointType } from '@/domain/sales-point/sales-point-type'

import type { Database } from '../client'

/** How many artisan names a result card shows before falling back to a count. */
const NAMES_PER_POINT = 3

type NearbySalesPointRow = {
  id: string
  name: string
  type: SalesPointType
  latitude: number
  longitude: number
  address: string | null
  opening_hours: string | null
  created_by: string
  created_at: Date
  distance_meters: number
  artisan_names: string[]
  /** bigint, which postgres.js hands over as a string. */
  artisan_count: string
}

export class DrizzleSalesPointSearchQuery implements SalesPointSearchQuery {
  constructor(private readonly db: Database) {}

  /**
   * One round trip for the whole screen. `ST_DWithin` over geography is the part the GiST index
   * accelerates, and `<->` then orders by true distance; the lateral join collects each point's
   * artisans in the same pass, so the list does not fall into a query per card.
   *
   * Raw SQL because neither the spatial operators nor the lateral join are expressible through
   * Drizzle's query builder.
   */
  async findNearby(search: NearbySalesPointSearch): Promise<NearbySalesPointSummary[]> {
    const { center, radius, limit = 50 } = search
    const point = sql`ST_SetSRID(ST_MakePoint(${center.longitude}, ${center.latitude}), 4326)::geography`

    const rows = await this.db.execute<NearbySalesPointRow>(sql`
      select
        sales_point.id,
        sales_point.name,
        sales_point.type,
        ST_Y(sales_point.location::geometry) as latitude,
        ST_X(sales_point.location::geometry) as longitude,
        sales_point.address,
        sales_point.opening_hours,
        sales_point.created_by,
        sales_point.created_at,
        ST_Distance(sales_point.location, ${point}) as distance_meters,
        sellers.names as artisan_names,
        sellers.total as artisan_count
      from sales_points sales_point
      left join lateral (
        select
          coalesce(
            array_agg(ranked.name order by ranked.name_order)
              filter (where ranked.name_order <= ${NAMES_PER_POINT}),
            '{}'::text[]
          ) as names,
          count(*) as total
        from (
          select
            artisan.name,
            row_number() over (order by artisan.name) as name_order
          from artisan_sales_points link
          join artisans artisan on artisan.id = link.artisan_id
          -- A null end date is what marks a link as current; past seasons stay as history.
          where link.sales_point_id = sales_point.id and link.ends_on is null
        ) ranked
      ) sellers on true
      where ST_DWithin(sales_point.location, ${point}, ${radius.meters})
      order by sales_point.location <-> ${point}
      limit ${limit}
    `)

    return rows.map(toSummary)
  }
}

function toSummary(row: NearbySalesPointRow): NearbySalesPointSummary {
  const coordinates = Coordinates.create(Number(row.latitude), Number(row.longitude))

  if (!coordinates.ok) {
    // Coordinates are validated before being stored, so a failure here means the row was written
    // by something other than this application.
    throw new Error(`Ponto de venda ${row.id} tem coordenadas inválidas no banco.`)
  }

  return {
    salesPoint: {
      id: row.id,
      name: row.name,
      type: row.type,
      coordinates: coordinates.value,
      address: row.address,
      openingHours: row.opening_hours,
      createdBy: row.created_by,
      createdAt: row.created_at,
    },
    distanceMeters: Number(row.distance_meters),
    artisanNames: row.artisan_names,
    artisanCount: Number(row.artisan_count),
  }
}
