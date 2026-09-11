import { index, pgEnum, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { SALES_POINT_TYPES } from '@/domain/sales-point/sales-point-type'

import { artisans } from './artisans'
import { geographyPoint } from './geography'

export const salesPointTypeEnum = pgEnum('sales_point_type', SALES_POINT_TYPES)

/**
 * The only geolocated table in the schema. A fair is created once and reused by every artisan who
 * sells there, which is why the N:N table below exists instead of a column on `artisans`.
 */
export const salesPoints = pgTable(
  'sales_points',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    type: salesPointTypeEnum('type').notNull(),
    location: geographyPoint('location').notNull(),
    address: text('address'),
    openingHours: text('opening_hours'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => artisans.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Without this GiST index every proximity search degrades into a full table scan.
    index('sales_points_location_idx').using('gist', table.location),
  ],
)

/**
 * Which artisans sell at which points, and when. `endsOn` null means the link is current; keeping
 * history matters because an itinerant artisan moves between fairs over the year.
 */
export const artisanSalesPoints = pgTable(
  'artisan_sales_points',
  {
    artisanId: uuid('artisan_id')
      .notNull()
      .references(() => artisans.id, { onDelete: 'cascade' }),
    salesPointId: uuid('sales_point_id')
      .notNull()
      .references(() => salesPoints.id, { onDelete: 'cascade' }),
    startsOn: timestamp('starts_on', { withTimezone: true }).notNull().defaultNow(),
    endsOn: timestamp('ends_on', { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.artisanId, table.salesPointId, table.startsOn] }),
    index('artisan_sales_points_sales_point_idx').on(table.salesPointId),
  ],
)
